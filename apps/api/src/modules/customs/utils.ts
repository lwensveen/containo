import { customsDocLinesTable, customsDocsTable, db } from '@containo/db';
import { desc, eq } from 'drizzle-orm';

export async function listCustomsDocs(opts: { poolId?: string; limit?: number }) {
  const q = db.select().from(customsDocsTable);

  return opts.poolId
    ? await q.where(eq(customsDocsTable.poolId, opts.poolId)).limit(opts.limit ?? 100)
    : await q.limit(opts.limit ?? 100);
}

export async function getCustomsDoc(id: string) {
  const [doc] = await db
    .select()
    .from(customsDocsTable)
    .where(eq(customsDocsTable.id, id))
    .limit(1);
  if (!doc) return null;

  const lines = await db
    .select()
    .from(customsDocLinesTable)
    .where(eq(customsDocLinesTable.docId, id))
    .orderBy(customsDocLinesTable.position, desc(customsDocLinesTable.createdAt));

  return { ...doc, lines };
}

export function genDocNumber(prefix = 'CUST') {
  const d = new Date();
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  const rnd = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${prefix}-${y}${m}${day}-${rnd}`;
}
