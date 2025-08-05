export type Dims = { length: number; width: number; height: number };
export type Mode = 'sea' | 'air';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export async function quote(body: {
  mode: Mode;
  weightKg: number;
  dimsCm: Dims;
  originPort?: string;
  destPort?: string;
}) {
  const res = await fetch(`${API}/pools/quote`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
    cache: 'no-store',
  });

  if (!res.ok) throw new Error(`Quote failed: ${res.status}`);

  return (await res.json()) as Promise<{
    userPrice: number;
    costBasis: number;
    serviceFee: number;
    margin: number;
    volumeM3: number;
    billableKg: number;
    breakdown: Record<string, number>;
  }>;
}

export async function intent(body: {
  userId: string;
  originPort: string;
  destPort: string;
  mode: Mode;
  cutoffISO: string;
  weightKg: number;
  dimsCm: Dims;
}) {
  const res = await fetch(`${API}/pools/intent`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
    cache: 'no-store',
  });

  if (!res.ok) throw new Error(`Intent failed: ${res.status}`);

  return (await res.json()) as Promise<{ id: string; accepted: true; volumeM3: number }>;
}

export async function getPools() {
  const res = await fetch(`${API}/pools`, { cache: 'no-store' });

  if (!res.ok) throw new Error(`Pools fetch failed: ${res.status}`);

  return (await res.json()) as Promise<
    Array<{
      id: string;
      originPort: string;
      destPort: string;
      mode: Mode;
      cutoffISO: string;
      capacityM3: string;
      usedM3: string;
      status: string;
    }>
  >;
}
