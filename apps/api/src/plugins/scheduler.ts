import { FastifyPluginAsync } from 'fastify';
import { assignPendingItemsToPools } from '../modules/pools/services/assign-pending-items.js';
import { bookClosingPools, closeExpiredOpenPools } from '../modules/pools/services/lifecycle.js';
import { accrueStorageFeesNow } from '../modules/inbound/services/storage.js';
import { runOnce } from '../modules/webhooks/workers/worker.js';

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

  const runWebhooks = async () => {
    try {
      const processed = await runOnce();
      if (processed) app.log.info({ processed }, 'webhook retry batch');
    } catch (err: any) {
      app.log.error({ err }, 'webhook retry failed');
    }
  };

  const runStorage = async () => {
    try {
      const res = await accrueStorageFeesNow();
      if (res.accrued) app.log.info(res, 'inbound storage accrual');
    } catch (err: any) {
      app.log.error({ err }, 'storage accrual failed');
    }
  };

  const idPools = setInterval(runPools, 30_000);
  const idLifecycle = setInterval(runLifecycle, 60_000);
  const whInterval = Number(process.env.WH_POLL_INTERVAL_MS ?? '5000');
  const idWebhooks = setInterval(runWebhooks, whInterval);
  const idStorage = setInterval(runStorage, 6 * 60 * 60 * 1000);

  app.addHook('onClose', async () => {
    clearInterval(idPools);
    clearInterval(idLifecycle);
    clearInterval(idWebhooks);
    clearInterval(idStorage);
  });
};

export default schedulerPlugin;
