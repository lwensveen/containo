import type { BookingProvider } from './types.js';
import { mockProvider } from './mock.js';
import { httpProvider } from './http.js';

export function getBookingProvider(): BookingProvider | null {
  const name = (process.env.BOOKING_PROVIDER ?? 'mock').toLowerCase();
  if (name === 'none' || name === 'off' || name === 'false') return null;

  switch (name) {
    case 'http':
    case 'zapier':
      return httpProvider;
    case 'mock':
    default:
      return mockProvider;
  }
}
