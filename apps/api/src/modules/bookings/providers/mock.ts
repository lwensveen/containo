import { randomUUID } from 'node:crypto';
import type { BookingProvider, BookingRequest, BookingResult } from './types.js';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const mockProvider: BookingProvider = {
  async book(req: BookingRequest): Promise<BookingResult> {
    await sleep(150); // simulate latency
    return {
      bookingRef: `MOCK-${randomUUID().slice(0, 8).toUpperCase()}`,
      carrier: req.pool.mode === 'sea' ? 'MockOcean' : 'MockAir',
      mode: req.pool.mode,
      etdISO: new Date(Date.now() + 3 * 86400_000).toISOString(),
    };
  },
};
