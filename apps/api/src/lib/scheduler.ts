import type { FastifyInstance } from 'fastify';
import { assignPendingItemsToPools } from '../modules/pools/services';

export function startScheduler(app: FastifyInstance) {
  const run = async () => {
    try {
      const changed = await assignPendingItemsToPools(app.log);
      if (changed) app.log.info({ changed }, 'pool assignment cycle');
    } catch (e) {
      app.log.error({ err: e }, 'assignPendingItemsToPools failed');
    }
  };

  // run every 30s in dev
  const id = setInterval(run, 30_000);
  app.addHook('onClose', async () => clearInterval(id));
}
