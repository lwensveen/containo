export type Mode = 'sea' | 'air';

export interface QuoteResponse {
  price: number;
  currency?: string;
  etaDays?: number;
  breakdown?: Record<string, number>;
}

export interface IntentResponse {
  id: string;
  accepted: true;
  volumeM3: number;
}

export interface Pool {
  id: string;
  originPort: string;
  destPort: string;
  mode: Mode;
  cutoffISO: string;
  capacityM3: string;
  usedM3: string;
  status: 'open' | 'closing' | 'booked' | 'in_transit' | 'arrived';
}

export interface PoolOrderOptions {
  originPort: string;
  destPort: string;
  weightKg: number;
  dimsCm: { length: number; width: number; height: number };
  mode: Mode;
  cutoffISO: string;
  idempotencyKey?: string;
  metadata?: Record<string, any>;
}

export interface InitOptions {
  apiBase: string;
  apiKey?: string;
  publishableKey?: string;
  defaultUserId?: string;
}
