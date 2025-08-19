import { db, poolsTable } from '@containo/db';
import { and, inArray, lt } from 'drizzle-orm';
import { bookContainer } from '../jobs/book-container.js';

const HOURS = Number(process.env.AUTOBOOK_HOURS_BEFORE ?? '12');
const FORCE_WINDOW_HOURS = Number(process.env.AUTOBOOK_FORCE_WINDOW_HOURS ?? '2');
const MIN_FILL = Number(process.env.MIN_BOOK_FILL ?? '0.9');

export async function autoBookTick(now = new Date()) {
  const soon = new Date(now.getTime() + HOURS * 3600_000);
  const forceWindow = new Date(now.getTime() + FORCE_WINDOW_HOURS * 3600_000);

  const candidates = await db
    .select()
    .from(poolsTable)
    .where(
      and(inArray(poolsTable.status, ['open', 'closing'] as const), lt(poolsTable.cutoffAt, soon))
    );

  for (const p of candidates) {
    const cap = Number(p.capacityM3) || 0;
    const used = Number(p.usedM3) || 0;
    const fill = cap ? used / cap : 0;
    const force = new Date(p.cutoffAt) <= forceWindow;

    if (fill >= MIN_FILL || force) {
      try {
        await bookContainer(p.id, { force });
      } catch (e) {
        /* empty */
      }
    }
  }
}
