import { FastifyPluginAsync } from 'fastify';
import { dispatchPendingWebhooks } from '../modules/webhooks/services/dispatch-pending-webhooks.js';
import { assignPendingItemsToPools } from '../modules/pools/services/assign-pending-items.js';

const schedulerPlugin: FastifyPluginAsync = async (app) => {
  const runPools = async () => {
    try {
      const changed = await assignPendingItemsToPools(app.log);
      if (changed) app.log.info({ changed }, 'pool assignment cycle');
    } catch (err: any) {
      app.log.error({ err }, 'assignPendingItemsToPools failed');
    }
  };

  const runWebhooks = async () => {
    try {
      const ok = await dispatchPendingWebhooks(20);
      if (ok) app.log.info({ ok }, 'webhook dispatch cycle');
    } catch (err: any) {
      app.log.error({ err }, 'dispatchPendingWebhooks failed');
    }
  };

  const id1 = setInterval(runPools, 30_000);
  const id2 = setInterval(runWebhooks, 5_000);

  app.addHook('onClose', async () => {
    clearInterval(id1);
    clearInterval(id2);
  });
};

export default schedulerPlugin;
