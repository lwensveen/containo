import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const STORAGE_RATE_PER_CBM_DAY = Number(
  process.env.NEXT_PUBLIC_STORAGE_RATE_PER_CBM_DAY ?? '1.2'
);
export const STORAGE_BASE_PER_DAY = Number(process.env.NEXT_PUBLIC_STORAGE_BASE_PER_DAY ?? '0');
export const STORAGE_CURRENCY = process.env.NEXT_PUBLIC_STORAGE_CURRENCY ?? 'EUR';

export type InboundRow = {
  id: string;
  userId: string;
  hubCode: string;
  originPort: string;
  destPort: string;
  mode: 'air' | 'sea';
  sellerName: string | null;
  extTracking: string | null;
  lengthCm: number | null;
  widthCm: number | null;
  heightCm: number | null;
  weightKg: string | null;
  notes: string | null;
  status: 'expected' | 'received' | 'measured' | 'priority_requested';
  photoUrl: string | null;
  poolId: string | null;
  receivedAt: string | null;
  freeUntilAt: string | null;
  createdAt: string;
  updatedAt?: string;
};

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function volumeM3(r: InboundRow) {
  const l = r.lengthCm ?? 0;
  const w = r.widthCm ?? 0;
  const h = r.heightCm ?? 0;
  return l && w && h ? (l * w * h) / 1_000_000 : 0;
}

export function daysOverdue(r: InboundRow): number {
  if (!r.freeUntilAt) return 0;
  const free = new Date(r.freeUntilAt).getTime();
  const now = Date.now();
  if (now <= free) return 0;
  return Math.ceil((now - free) / 86_400_000);
}

export function storageEstimate(r: InboundRow) {
  const days = daysOverdue(r);
  const vol = volumeM3(r);
  const amount = days > 0 ? days * (STORAGE_BASE_PER_DAY + vol * STORAGE_RATE_PER_CBM_DAY) : 0;
  return { days, vol, amount };
}

export const money = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: STORAGE_CURRENCY }).format(n);
