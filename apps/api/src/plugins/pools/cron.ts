import fp from 'fastify-plugin';
import { and, eq, sql } from 'drizzle-orm';
import { db, poolEventsTable, poolsTable } from '@containo/db';

/**
 * CRON: advance pool status by time
 * - open     → closing   when cutoffAt <= now()
 * - closing  → booked    when cutoffAt <= now() - N hours
 * Emits pool_events rows for each transition.
 */
export default fp(async function poolsCron(app) {
  const enabled = (process.env.CRON_POOLS_ENABLED ?? 'true').toLowerCase() === 'true';
  if (!enabled) {
    app.log.info('[pools-cron] disabled via CRON_POOLS_ENABLED');
    return;
  }

  const periodSec = Number(process.env.CRON_POOLS_PERIOD_SEC ?? 300); // 5 min
  const bookAfterHours = Number(process.env.POOL_BOOK_AFTER_HOURS ?? 6); // hours after cutoff
  let running = false;

  async function runOnce() {
    if (running) return;
    running = true;
    try {
      const toClosing = await db
        .update(poolsTable)
        .set({ status: 'closing', updatedAt: sql`now()` })
        .where(and(eq(poolsTable.status, 'open'), sql`${poolsTable.cutoffAt} <= now()`))
        .returning({
          id: poolsTable.id,
          originPort: poolsTable.originPort,
          destPort: poolsTable.destPort,
          mode: poolsTable.mode,
          cutoffAt: poolsTable.cutoffAt,
        });

      if (toClosing.length) {
        await db.insert(poolEventsTable).values(
          toClosing.map((p) => ({
            poolId: p.id,
            type: 'status_changed' as any,
            payload: {
              from: 'open',
              to: 'closing',
              originPort: p.originPort,
              destPort: p.destPort,
              mode: p.mode,
              cutoffAt: p.cutoffAt,
            },
          }))
        );
      }

      const toBooked = await db
        .update(poolsTable)
        .set({ status: 'booked', updatedAt: sql`now()` })
        .where(
          and(
            eq(poolsTable.status, 'closing'),
            sql`${poolsTable.cutoffAt} <= now() - interval '${bookAfterHours} hours'`
          )
        )
        .returning({
          id: poolsTable.id,
          originPort: poolsTable.originPort,
          destPort: poolsTable.destPort,
          mode: poolsTable.mode,
          cutoffAt: poolsTable.cutoffAt,
        });

      if (toBooked.length) {
        await db.insert(poolEventsTable).values(
          toBooked.map((p) => ({
            poolId: p.id,
            type: 'status_changed' as any,
            payload: {
              from: 'closing',
              to: 'booked',
              originPort: p.originPort,
              destPort: p.destPort,
              mode: p.mode,
              cutoffAt: p.cutoffAt,
            },
          }))
        );
      }

      app.log.info(
        { closing: toClosing.length, booked: toBooked.length },
        '[pools-cron] tick complete'
      );
    } catch (err) {
      app.log.error(err, '[pools-cron] tick failed');
    } finally {
      running = false;
    }
  }

  setTimeout(runOnce, 3_000);
  const timer = setInterval(runOnce, Math.max(30, periodSec) * 1000);
  app.addHook('onClose', async () => clearInterval(timer));

  app.decorate('poolsCronRunOnce', runOnce);
});
