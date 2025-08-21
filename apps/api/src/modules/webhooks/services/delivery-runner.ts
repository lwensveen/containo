import { runOnce } from '../workers/worker.js';

const interval = Number(process.env.WH_POLL_INTERVAL_MS ?? '5000');

(async function loop() {
  while (true) {
    try {
      await runOnce();
    } catch (e) {
      console.error('[webhooks] worker error:', e);
    }
    await new Promise((r) => setTimeout(r, interval));
  }
})();
