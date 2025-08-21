import fp from 'fastify-plugin';
import { and, eq, sql } from 'drizzle-orm';
import { db, poolEventsTable, poolsTable } from '@containo/db';

/**
 * CRON: advance pool status by time
 * - open      → closing     when cutoffAt <= now()
 * - closing   → booked      when cutoffAt <= now() - N hours
 * - booked    → in_transit  when updatedAt <= now() - M hours (simple "post-booking" timer)
 * Emits pool_events rows for each transition.
 *
 * Env:
 *  - CRON_POOLS_ENABLED=true|false
 *  - CRON_POOLS_PERIOD_SEC=300
 *  - POOL_BOOK_AFTER_HOURS=6
 *  - POOL_INTRANSIT_AFTER_HOURS=24
 */
export default fp(async function poolsCron(app) {
  const enabled = (process.env.CRON_POOLS_ENABLED ?? 'true').toLowerCase() === 'true';
  if (!enabled) {
    app.log.info('[pools-cron] disabled via CRON_POOLS_ENABLED');
    return;
  }

  const periodSec = Number(process.env.CRON_POOLS_PERIOD_SEC ?? 300); // 5 min
  const bookAfterHours = Number(process.env.POOL_BOOK_AFTER_HOURS ?? 6); // hours after cutoff
  const inTransitAfterHours = Number(process.env.POOL_INTRANSIT_AFTER_HOURS ?? 24); // hours after booked
  let running = false;

  async function toClosing() {
    const rows = await db
      .update(poolsTable)
      .set({ status: 'closing', updatedAt: new Date() })
      .where(and(eq(poolsTable.status, 'open'), sql`${poolsTable.cutoffAt} <= now()`))
      .returning({
        id: poolsTable.id,
        originPort: poolsTable.originPort,
        destPort: poolsTable.destPort,
        mode: poolsTable.mode,
        cutoffAt: poolsTable.cutoffAt,
      });

    if (rows.length) {
      await db.insert(poolEventsTable).values(
        rows.map((p) => ({
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
    return rows.length;
  }

  async function toBooked() {
    const rows = await db
      .update(poolsTable)
      .set({ status: 'booked', updatedAt: new Date() })
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

    if (rows.length) {
      await db.insert(poolEventsTable).values(
        rows.map((p) => ({
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
      await db.insert(poolEventsTable).values(
        rows.map((p) => ({
          poolId: p.id,
          type: 'booking_requested' as any,
          payload: {},
        }))
      );
    }
    return rows.length;
  }

  async function toInTransit() {
    const rows = await db
      .update(poolsTable)
      .set({ status: 'in_transit', updatedAt: new Date() })
      .where(
        and(
          eq(poolsTable.status, 'booked'),
          sql`${poolsTable.updatedAt} <= now() - interval '${inTransitAfterHours} hours'`
        )
      )
      .returning({ id: poolsTable.id })
      .catch((err) => {
        // Some databases might not like updatedAt in interval math if nulls sneak in
        app.log.error({ err }, '[pools-cron] booked→in_transit update failed');
        return [];
      });

    if (rows.length) {
      await db.insert(poolEventsTable).values(
        rows.map((p) => ({
          poolId: p.id,
          type: 'status_changed' as any,
          payload: { from: 'booked', to: 'in_transit' },
        }))
      );
    }
    return rows.length;
  }

  async function runOnce() {
    if (running) return;
    running = true;
    try {
      const n1 = await toClosing();
      const n2 = await toBooked();
      const n3 = await toInTransit();
      if (n1 + n2 + n3 > 0) {
        app.log.info(
          { closing: n1, booked: n2, in_transit: n3 },
          '[pools-cron] tick complete (state advances)'
        );
      }
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
