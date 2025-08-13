import { FastifyPluginAsync } from 'fastify';
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

  const idPools = setInterval(runPools, 30_000);

  app.addHook('onClose', async () => {
    clearInterval(idPools);
  });
};

export default schedulerPlugin;
