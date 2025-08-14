import { IntentResponse } from '@containo/checkout-plugin';
import { Pool, QuoteResponse } from '@containo/types';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
const API_KEY = process.env.NEXT_PUBLIC_API_KEY;

function withKey(init?: RequestInit): RequestInit {
  const h = { ...(init?.headers || {}), ...(API_KEY ? { 'x-api-key': API_KEY } : {}) };
  return { ...init, headers: h };
}

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

export async function getPoolItems(poolId: string) {
  const res = await fetch(`${API}/pools/${poolId}/items`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Pool items failed: ${res.status}`);
  return res.json() as Promise<{
    pool: Pool;
    items: Array<{
      id: string;
      userId: string;
      originPort: string;
      destPort: string;
      mode: 'sea' | 'air';
      cutoffISO: string;
      weightKg: string;
      volumeM3: string;
      length: string;
      width: string;
      height: string;
      status: string;
      createdAt: string;
    }>;
  }>;
}

export async function setPoolStatus(poolId: string, status: 'open' | 'closing' | 'closed') {
  const res = await fetch(`${API}/pools/${poolId}/status`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error(`Update status failed: ${res.status}`);
  return res.json() as Promise<Pool>;
}

export type WebhookSubscription = {
  id: string;
  url: string;
  events: string;
  secret: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string | null;
};

export async function listWebhookSubscriptions(): Promise<WebhookSubscription[]> {
  const res = await fetch(`${API}/webhooks/subscriptions`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`List webhooks failed: ${res.status}`);
  return res.json();
}

export async function createWebhookSubscription(input: {
  url: string;
  events?: string; // default '*'
  secret: string;
}): Promise<WebhookSubscription> {
  const res = await fetch(`${API}/webhooks/subscriptions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ events: '*', ...input }),
  });
  if (!res.ok) throw new Error(`Create webhook failed: ${res.status}`);
  return res.json();
}

export async function setWebhookActive(id: string, active: boolean) {
  const path = active ? 'enable' : 'disable';
  const res = await fetch(`${API}/webhooks/subscriptions/${id}/${path}`, { method: 'POST' });
  if (!res.ok) throw new Error(`Toggle webhook failed: ${res.status}`);
  return res.json() as Promise<WebhookSubscription>;
}
