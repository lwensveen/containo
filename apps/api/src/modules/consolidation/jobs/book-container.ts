import { and, eq, inArray } from 'drizzle-orm';
import { db, poolItemsTable, poolsTable } from '@containo/db';
import { emitPoolEvent } from '../../events/services/emit-pool-event.js';
import { getBookingProvider } from '../../bookings/providers/index.js';
import { randomUUID } from 'node:crypto';

const MIN_BOOK_FILL = Number(process.env.MIN_BOOK_FILL ?? '0.9');

function genBookingRef() {
  const date = new Date();
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  const rnd = randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase();
  return `BK-${year}${month}${day}-${rnd}`;
}

export async function bookContainer(
  poolId: string,
  opts?: { force?: boolean; bookingRef?: string }
) {
  return db.transaction(async (tx) => {
    const [pool] = await tx.select().from(poolsTable).where(eq(poolsTable.id, poolId)).limit(1);

    if (!pool) throw new Error('Pool not found');
    if (['booked', 'in_transit', 'arrived'].includes(pool.status)) return pool;

    if (!['open', 'closing'].includes(pool.status)) {
      throw new Error(`Pool status must be 'open' or 'closing', got '${pool.status}'`);
    }

    const cap = Number(pool.capacityM3);
    const used = Number(pool.usedM3);
    const fill = cap > 0 ? used / cap : 0;

    if (!opts?.force && fill < MIN_BOOK_FILL) {
      throw new Error(`Pool fill ${Math.round(fill * 100)}% below minimum.`);
    }

    const items = await tx
      .select({
        id: poolItemsTable.id,
        userId: poolItemsTable.userId,
        weightKg: poolItemsTable.weightKg,
        volumeM3: poolItemsTable.volumeM3,
        length: poolItemsTable.length,
        width: poolItemsTable.width,
        height: poolItemsTable.height,
      })
      .from(poolItemsTable)
      .where(eq(poolItemsTable.poolId, poolId));

    await emitPoolEvent({
      poolId: pool.id,
      type: 'booking_requested',
      payload: {
        fill,
        cutoffISO: pool.cutoffISO,
      },
    });

    const provider = getBookingProvider();

    let bookingRef = opts?.bookingRef ?? null;
    let carrier: string | undefined;
    let etdISO: string | undefined;

    if (provider) {
      try {
        const res = await provider.book({
          pool: {
            id: pool.id,
            originPort: pool.originPort,
            destPort: pool.destPort,
            mode: pool.mode,
            cutoffISO: pool.cutoffISO,
            capacityM3: Number(pool.capacityM3),
            usedM3: Number(pool.usedM3),
          },
          items: items.map((it) => ({
            id: it.id,
            userId: it.userId ?? undefined,
            weightKg: Number(it.weightKg),
            volumeM3: Number(it.volumeM3),
            length: Number(it.length),
            width: Number(it.width),
            height: Number(it.height),
          })),
        });

        bookingRef = res.bookingRef;
        carrier = res.carrier;
        etdISO = res.etdISO;
      } catch (err: any) {
        await emitPoolEvent({
          poolId: pool.id,
          type: 'booking_failed',
          payload: { message: String(err?.message ?? err) },
        });
        throw err;
      }
    } else {
      bookingRef = bookingRef ?? genBookingRef();
    }

    const updated = await tx
      .update(poolsTable)
      .set({ status: 'booked', bookingRef })
      .where(
        and(eq(poolsTable.id, poolId), inArray(poolsTable.status, ['open', 'closing'] as const))
      )
      .returning();

    const row = updated[0] ?? pool;

    await emitPoolEvent({
      poolId: row.id,
      type: 'booking_confirmed',
      payload: { bookingRef, carrier, etdISO },
    });

    await emitPoolEvent({
      poolId: row.id,
      type: 'status_changed',
      payload: { status: 'booked', bookingRef },
    });

    if (fill >= 1.0) {
      await emitPoolEvent({ poolId: row.id, type: 'fill_100', payload: { fill } });
    }

    return row;
  });
}
