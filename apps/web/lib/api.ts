import { IntentResponse } from '@containo/checkout-plugin';
import {
  IntentInputSchema,
  IntentResponseSchema,
  Pool,
  PoolSelectSchema,
  QuoteInputSchema,
  QuoteResponse,
  QuoteSchema,
} from '@containo/types';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export async function quote(input: unknown): Promise<QuoteResponse> {
  const body = QuoteInputSchema.parse(input);

  const res = await fetch(`${API}/pools/quote`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    cache: 'no-store',
  });

  if (!res.ok) throw new Error(`Quote failed: ${res.status}`);

  const json = await res.json();

  return QuoteSchema.parse(json);
}

export async function intent(input: unknown): Promise<IntentResponse> {
  const body = IntentInputSchema.parse(input);

  const res = await fetch(`${API}/pools/intent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    cache: 'no-store',
  });

  if (!res.ok) throw new Error(`Intent failed: ${res.status}`);

  const json = await res.json();

  return IntentResponseSchema.parse(json);
}

export async function getPools(): Promise<Pool[]> {
  const res = await fetch(`${API}/pools`, { cache: 'no-store' });

  if (!res.ok) throw new Error(`Pools fetch failed: ${res.status}`);

  const raw = await res.json();

  return PoolSelectSchema.array().parse(raw);
}
