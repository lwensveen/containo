export type Mode = 'sea' | 'air';

export interface QuoteResponse {
  price: number;
  currency: string;
  etaDays: number;
}

export interface IntentResponse {
  id: string;
  accepted: true;
  volumeM3: number;
}

export interface PoolOrderOptions {
  originPort: string;
  destPort: string;
  weightKg: number;
  dimsCm: { l: number; w: number; h: number };
  mode: Mode;
  cutoffISO: string;
  metadata?: Record<string, any>;
  onQuote?: (quote: QuoteResponse) => void;
  onIntent?: (intent: IntentResponse) => void;
}

let _apiBase = '';

export function init({ apiBase }: { apiBase: string }): void {
  _apiBase = apiBase.replace(/\/+$/, '');
  if (typeof window !== 'undefined') {
    // Expose for <script> tag usage
    (window as any).Containo = { init, quote, intent, poolOrder };
  }
}

async function _post<T>(path: string, body: any, headers: Record<string, string> = {}): Promise<T> {
  if (!_apiBase) throw new Error('Containo not initialized');
  const resp = await fetch(`${_apiBase}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
  if (!resp.ok) throw new Error(`${path} failed: ${resp.status}`);
  return resp.json();
}

export async function quote(options: PoolOrderOptions): Promise<QuoteResponse> {
  const data = await _post<QuoteResponse>('/poolsTable/quote', {
    originPort: options.originPort,
    destPort: options.destPort,
    mode: options.mode,
    cutoffISO: options.cutoffISO,
    weightKg: options.weightKg,
    dimsCm: options.dimsCm,
  });
  options.onQuote?.(data);
  return data;
}

export async function intent(
  options: PoolOrderOptions & { idempotencyKey?: string }
): Promise<IntentResponse> {
  const headers: Record<string, string> = {};
  if (options.idempotencyKey) headers['Idempotency-Key'] = options.idempotencyKey;

  const data = await _post<IntentResponse>(
    '/poolsTable/intent',
    {
      userId: options.metadata?.userId ?? '',
      originPort: options.originPort,
      destPort: options.destPort,
      mode: options.mode,
      cutoffISO: options.cutoffISO,
      weightKg: options.weightKg,
      dimsCm: options.dimsCm,
    },
    headers
  );
  options.onIntent?.(data);
  return data;
}

export async function poolOrder(
  opts: PoolOrderOptions & { idempotencyKey?: string }
): Promise<IntentResponse> {
  const q = await quote(opts);
  // UI can use onQuote, or handle q directly
  return intent(opts);
}

export default { init, quote, intent, poolOrder };
