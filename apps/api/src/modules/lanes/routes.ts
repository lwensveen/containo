import type { FastifyInstance } from 'fastify';
import { z } from 'zod/v4';
import {
  createPool,
  createPoolInput,
  getNextOpenPool,
  listPools,
  updatePool,
  updatePoolInput,
} from './services.js';
import { db, laneRatesTable } from '@containo/db';
import { and, asc, eq, or, sql } from 'drizzle-orm';
import { chargeableKgFromDims, m3FromDims } from './utils.js';

const QuoteQuery = z.object({
  originPort: z.string().length(3),
  destPort: z.string().length(3),
  mode: z.enum(['sea', 'air']),
  weightKg: z.coerce.number().nonnegative().default(0),
  dimsL: z.coerce.number().positive(),
  dimsW: z.coerce.number().positive(),
  dimsH: z.coerce.number().positive(),
  pieces: z.coerce.number().int().positive().default(1),
});

type QuoteQuery = z.infer<typeof QuoteQuery>;

export default async function lanesRoutes(app: FastifyInstance) {
  app.get('/lanes/next', {
    schema: {
      querystring: z
        .object({
          originPort: z.string().length(3),
          destPort: z.string().length(3),
          mode: z.enum(['air', 'sea']),
        })
        .strict() as any,
    },
    handler: async (req, reply) => {
      const { originPort, destPort, mode } = req.query as {
        originPort: string;
        destPort: string;
        mode: 'air' | 'sea';
      };
      const next = await getNextOpenPool({ originPort, destPort, mode });
      if (!next) return reply.code(404).send({ error: 'no_open_pool' });
      reply.send(next);
    },
  });

  app.post('/lanes/pools', {
    schema: { body: createPoolInput as any },
    // you can add auth preHandler later
    handler: async (req, reply) => {
      const { id, duplicate } = await createPool(req.body as any);
      reply.send({ id, duplicate });
    },
  });

  app.get('/lanes/pools', {
    schema: {
      querystring: z
        .object({
          originPort: z.string().length(3).optional(),
          destPort: z.string().length(3).optional(),
          mode: z.enum(['air', 'sea']).optional(),
          status: z.string().optional() /* comma list, e.g. "open,closing" */,
          limit: z.coerce.number().min(1).max(200).optional(),
        })
        .strict() as any,
    },
    handler: async (req, reply) => {
      const q = req.query as {
        originPort?: string;
        destPort?: string;
        mode?: 'air' | 'sea';
        status?: string;
        limit?: number;
      };

      const rows = await listPools({
        originPort: q.originPort,
        destPort: q.destPort,
        mode: q.mode,
        status: q.status ? (q.status.split(',') as any) : undefined,
        limit: q.limit,
      });
      reply.send(rows);
    },
  });

  app.patch('/lanes/pools/:id', {
    schema: {
      params: z.object({ id: z.string().uuid() }).strict() as any,
      body: updatePoolInput as any,
    },
    handler: async (req, reply) => {
      const { id } = req.params as { id: string };
      const row = await updatePool(id, req.body as any);
      if (!row) return reply.code(404).send({ error: 'not_found' });
      reply.send(row);
    },
  });

  app.get('/quote', { schema: { querystring: QuoteQuery as any } }, async (req, reply) => {
    const q = QuoteQuery.parse(req.query);

    const now = new Date();

    const rates = await db
      .select()
      .from(laneRatesTable)
      .where(
        and(
          eq(laneRatesTable.originPort, q.originPort.toUpperCase()),
          eq(laneRatesTable.destPort, q.destPort.toUpperCase()),
          eq(laneRatesTable.mode, q.mode),
          eq(laneRatesTable.active, true),
          or(
            sql`${laneRatesTable.effectiveFrom} IS NULL`,
            sql`${laneRatesTable.effectiveFrom} <= ${now}`
          ),
          or(
            sql`${laneRatesTable.effectiveTo} IS NULL`,
            sql`${laneRatesTable.effectiveTo} > ${now}`
          )
        )
      )
      .orderBy(asc(laneRatesTable.priority), sql`${laneRatesTable.effectiveFrom} DESC`)
      .limit(1);

    const rate = rates[0];
    if (!rate) {
      return reply.code(404).send({
        error: 'no_rate',
        message: `No active rate for ${q.originPort.toUpperCase()}→${q.destPort.toUpperCase()} (${q.mode}).`,
      });
    }

    const seaPricePerCbm = rate.seaPricePerCbm ? Number(rate.seaPricePerCbm) : null;
    const seaMinPrice = rate.seaMinPrice ? Number(rate.seaMinPrice) : null;
    const airPricePerKg = rate.airPricePerKg ? Number(rate.airPricePerKg) : null;
    const airMinPrice = rate.airMinPrice ? Number(rate.airMinPrice) : null;
    const fee = rate.serviceFeePerOrder ? Number(rate.serviceFeePerOrder) : 0;
    const volumeM3 = m3FromDims(q.dimsL, q.dimsW, q.dimsH, q.pieces);
    const divisor = Number(process.env.AIR_CHARGE_DIVISOR ?? '6000');
    const volumetricKg = chargeableKgFromDims(q.dimsL, q.dimsW, q.dimsH, q.pieces, divisor);
    const chargeableKg = Math.max(q.weightKg, volumetricKg);

    let subtotal = 0;
    let minApplied = false;
    let unitPrice = 0;

    if (q.mode === 'sea') {
      if (!seaPricePerCbm) {
        return reply
          .code(400)
          .send({ error: 'rate_missing', message: 'Missing sea price per CBM.' });
      }
      unitPrice = seaPricePerCbm;
      const base = volumeM3 * seaPricePerCbm;
      if (seaMinPrice != null && base < seaMinPrice) {
        subtotal = seaMinPrice;
        minApplied = true;
      } else {
        subtotal = base;
      }
    } else {
      if (!airPricePerKg) {
        return reply
          .code(400)
          .send({ error: 'rate_missing', message: 'Missing air price per KG.' });
      }
      unitPrice = airPricePerKg;
      const base = chargeableKg * airPricePerKg;
      if (airMinPrice != null && base < airMinPrice) {
        subtotal = airMinPrice;
        minApplied = true;
      } else {
        subtotal = base;
      }
    }

    const total = subtotal + fee;

    return reply.send({
      lane: {
        originPort: q.originPort.toUpperCase(),
        destPort: q.destPort.toUpperCase(),
        mode: q.mode,
      },
      dims: {
        L_cm: q.dimsL,
        W_cm: q.dimsW,
        H_cm: q.dimsH,
        pieces: q.pieces,
        volumeM3: Number(volumeM3.toFixed(4)),
      },
      weight: {
        actualKg: Number(q.weightKg.toFixed(3)),
        volumetricKg: Number(volumetricKg.toFixed(3)),
        chargeableKg: Number(chargeableKg.toFixed(3)),
        divisor,
      },
      rate: {
        id: rate.id,
        priority: rate.priority ?? 0,
        effectiveFrom: rate.effectiveFrom ?? null,
        effectiveTo: rate.effectiveTo ?? null,
        seaPricePerCbm,
        seaMinPrice,
        airPricePerKg,
        airMinPrice,
        serviceFeePerOrder: fee,
      },
      price: {
        currency: 'USD',
        unitPrice,
        subtotal: Number(subtotal.toFixed(2)),
        serviceFee: Number(fee.toFixed(2)),
        total: Number(total.toFixed(2)),
        minimumApplied: minApplied,
        basis: q.mode === 'sea' ? 'CBM' : 'chargeable_kg',
      },
    });
  });
}
