import { FastifyPluginAsync } from 'fastify';
import { assignPendingItemsToPools } from '../modules/pools/services/assign-pending-items.js';
import { bookClosingPools, closeExpiredOpenPools } from '../modules/pools/services/lifecycle.js';

const schedulerPlugin: FastifyPluginAsync = async (app) => {
  const runPools = async () => {
    try {
      const changed = await assignPendingItemsToPools(app.log);
      if (changed) app.log.info({ changed }, 'pool assignment cycle');
    } catch (err: any) {
      app.log.error({ err }, 'assignPendingItemsToPools failed');
    }
  };

  const GRACE_HOURS = Number(process.env.POOL_BOOK_GRACE_HOURS ?? 6);
  const runLifecycle = async () => {
    try {
      const closed = await closeExpiredOpenPools();
      const booked = await bookClosingPools(GRACE_HOURS);
      if (closed || booked) app.log.info({ closed, booked }, 'pool lifecycle cycle');
    } catch (err: any) {
      app.log.error({ err }, 'pool lifecycle failed');
    }
  };

  const idPools = setInterval(runPools, 30_000);
  const idLifecycle = setInterval(runLifecycle, 60_000);

  app.addHook('onClose', async () => {
    clearInterval(idPools);
    clearInterval(idLifecycle);
  });
};

export default schedulerPlugin;
