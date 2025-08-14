import type { BookingProvider, BookingRequest, BookingResult } from './types.js';

export const httpProvider: BookingProvider = {
  async book(req: BookingRequest): Promise<BookingResult> {
    const url = process.env.BOOKING_HTTP_URL!;
    const auth = process.env.BOOKING_HTTP_AUTH;
    const r = await fetch(url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(auth ? { authorization: auth } : {}),
      },
      body: JSON.stringify(req),
    });

    if (!r.ok) throw new Error(`HTTP booking failed: ${r.status}`);

    const json = await r.json();

    if (!json.bookingRef) throw new Error('No bookingRef in provider response');

    return {
      bookingRef: String(json.bookingRef),
      carrier: json.carrier ?? undefined,
      mode: json.mode === 'air' ? 'air' : 'sea',
      etdISO: json.etdISO ?? undefined,
    };
  },
};
