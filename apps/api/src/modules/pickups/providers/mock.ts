import type { PickupProvider, SchedulePickupRequest, SchedulePickupResult } from './types.js';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const rand = () => Math.random().toString(36).slice(2, 10).toUpperCase();

export const mockPickupProvider: PickupProvider = {
  async schedule(req: SchedulePickupRequest): Promise<SchedulePickupResult> {
    await sleep(150);
    return {
      carrierRef: `PU-${rand()}`,
      labelUrl: 'https://example.com/mock-label.pdf',
      scheduled: true,
    };
  },
};
