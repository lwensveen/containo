import type { PickupProvider } from './types.js';
import { mockPickupProvider } from './mock.js';

export function getPickupProvider(): PickupProvider | null {
  const name = (process.env.PICKUP_PROVIDER ?? 'mock').toLowerCase();
  if (['none', 'off', 'false'].includes(name)) return null;

  switch (name) {
    case 'mock':
    default:
      return mockPickupProvider;
  }
}
