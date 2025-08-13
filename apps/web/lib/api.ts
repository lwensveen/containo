import { IntentResponse } from '@containo/checkout-plugin';
import { Pool, QuoteResponse } from '@containo/types';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export async function quote(input: unknown): Promise<QuoteResponse> {
  const res = await fetch(`${API}/pools/quote`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
    cache: 'no-store',
  });

  if (!res.ok) throw new Error(`Quote failed: ${res.status}`);

  return await res.json();
}

export async function intent(input: unknown): Promise<IntentResponse> {
  const res = await fetch(`${API}/pools/intent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
    cache: 'no-store',
  });

  if (!res.ok) throw new Error(`Intent failed: ${res.status}`);

  return await res.json();
}

export async function getPools(): Promise<Pool[]> {
  const res = await fetch(`${API}/pools`, { cache: 'no-store' });

  if (!res.ok) throw new Error(`Pools fetch failed: ${res.status}`);

  return await res.json();
}
