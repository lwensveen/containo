import { InitOptions, IntentResponse, Pool, PoolOrderOptions, QuoteResponse } from './types.js';

let API_BASE = '';
let PUBLISHABLE_KEY: string | undefined;
let DEFAULT_USER_ID: string | undefined;

export function init(opts: InitOptions) {
  API_BASE = opts.apiBase.replace(/\/+$/, '');
  PUBLISHABLE_KEY = opts.apiKey ?? opts.publishableKey;
  DEFAULT_USER_ID = opts.defaultUserId;
}

function headers(extra?: Record<string, string>) {
  const h: Record<string, string> = { 'Content-Type': 'application/json' };

  if (PUBLISHABLE_KEY) h['X-Containo-Key'] = PUBLISHABLE_KEY;

  return { ...h, ...(extra || {}) };
}

async function postJSON<T>(path: string, body: any, h?: Record<string, string>): Promise<T> {
  if (!API_BASE) throw new Error('Containo not initialized: call init({ apiBase }) first.');

  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: headers(h),
    body: JSON.stringify(body),
  });

  if (!res.ok) throw new Error(`${path} failed: ${res.status}`);

  return res.json();
}

async function getJSON<T>(path: string): Promise<T> {
  if (!API_BASE) throw new Error('Containo not initialized: call init({ apiBase }) first.');

  const res = await fetch(`${API_BASE}${path}`, { headers: headers() });

  if (!res.ok) throw new Error(`${path} failed: ${res.status}`);

  return res.json();
}

export async function getPools(): Promise<Pool[]> {
  return getJSON<Pool[]>('/pools');
}

export async function quote(opts: PoolOrderOptions): Promise<QuoteResponse> {
  return postJSON<QuoteResponse>('/pools/quote', {
    originPort: opts.originPort,
    destPort: opts.destPort,
    mode: opts.mode,
    cutoffAt: opts.cutoffAt,
    weightKg: opts.weightKg,
    dimsCm: opts.dimsCm,
  });
}

export async function intent(opts: PoolOrderOptions): Promise<IntentResponse> {
  const h: Record<string, string> = {};

  if (opts.idempotencyKey) h['Idempotency-Key'] = opts.idempotencyKey;

  const userId = (opts.metadata?.userId as string | undefined) ?? DEFAULT_USER_ID ?? 'guest';

  return postJSON<IntentResponse>('/pools/intent', { userId, ...opts }, h);
}
