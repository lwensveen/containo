import type { FastifyInstance } from 'fastify';
import { z } from 'zod/v4';
import {
  CustomsDocCreateSchema,
  CustomsDocIdParamSchema,
  CustomsDocListQuerySchema,
  CustomsDocListResponseSchema,
  CustomsDocRecordSchema,
} from '@containo/types';
import { renderCustomsPdf } from './services/generate-pdf.js';
import { getCustomsDoc, listCustomsDocs } from './utils.js';
import { createCustomsDoc } from './services/create-customs-doc.js';

const PdfKindSchema = z.enum(['invoice', 'packing']);
const PdfParamsSchema = CustomsDocIdParamSchema.extend({ kind: PdfKindSchema });

export default function customsRoutes(app: FastifyInstance) {
  app.post<{
    Body: z.infer<typeof CustomsDocCreateSchema>;
    Reply: z.infer<typeof CustomsDocRecordSchema>;
  }>(
    '/',
    { schema: { body: CustomsDocCreateSchema, response: { 201: CustomsDocRecordSchema } } },
    async (req, reply) => {
      const doc = await createCustomsDoc(req.body);
      return reply.code(201).send(doc);
    }
  );

  app.get<{
    Querystring: z.infer<typeof CustomsDocListQuerySchema>;
    Reply: z.infer<typeof CustomsDocListResponseSchema>;
  }>(
    '/',
    {
      schema: {
        querystring: CustomsDocListQuerySchema,
        response: { 200: CustomsDocListResponseSchema },
      },
    },
    async (req) => {
      const rows = await listCustomsDocs({ poolId: req.query.poolId, limit: req.query.limit });

      return rows.map((r) => ({
        id: r.id,
        poolId: r.poolId,
        docNumber: r.docNumber,
        exporterName: r.exporterName,
        importerName: r.importerName,
        currency: r.currency,
        totalValue: r.totalValue,
        createdAt: r.createdAt!,
      }));
    }
  );

  app.get<{
    Params: z.infer<typeof CustomsDocIdParamSchema>;
    Reply: z.infer<typeof CustomsDocRecordSchema>;
  }>(
    '/:id',
    { schema: { params: CustomsDocIdParamSchema, response: { 200: CustomsDocRecordSchema } } },
    async (req, reply) => {
      const doc = await getCustomsDoc(req.params.id);
      if (!doc) return reply.notFound('Not found');
      return CustomsDocRecordSchema.parse(doc);
    }
  );

  app.get<{
    Params: z.infer<typeof PdfParamsSchema>;
  }>('/:id/:kind.pdf', { schema: { params: PdfParamsSchema } }, async (req, reply) => {
    const doc = await getCustomsDoc(req.params.id);
    if (!doc) return reply.notFound('Not found');

    const images = process.env.CUSTOMS_STAMP_B64
      ? { stamp: process.env.CUSTOMS_STAMP_B64 }
      : undefined;

    const pdf = await renderCustomsPdf(CustomsDocRecordSchema.parse(doc), req.params.kind, {
      images,
    });

    reply.header('content-type', 'application/pdf');
    reply.header(
      'content-disposition',
      `inline; filename="${req.params.kind}_${doc.docNumber || req.params.id}.pdf"`
    );
    return reply.send(pdf);
  });
}
