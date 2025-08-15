'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
const DEMO_USER = process.env.NEXT_PUBLIC_DEMO_USER_ID ?? '00000000-0000-0000-0000-000000000000';

type Shipment = {
  itemId: string;
  poolId: string | null;
  status:
    | 'pending'
    | 'pooled'
    | 'pay_pending'
    | 'paid'
    | 'shipped'
    | 'delivered'
    | 'refunded'
    | string;
  weightKg: number;
  volumeM3: number;
  length: number;
  width: number;
  height: number;
  createdAt: string;
  originPort: string | null;
  destPort: string | null;
  mode: 'sea' | 'air' | null;
  cutoffISO: string | null;
  poolStatus: 'open' | 'closing' | 'booked' | 'in_transit' | 'arrived' | string | null;
  capacityM3: number | null;
  usedM3: number | null;
  fillPercent: number | null;
  bookingRef?: string | null;
  stripeSessionId?: string | null;
};

function statusColor(s: Shipment['status']) {
  switch (s) {
    case 'pending':
      return 'bg-slate-500';
    case 'pooled':
      return 'bg-amber-600';
    case 'pay_pending':
      return 'bg-blue-600';
    case 'paid':
      return 'bg-indigo-600';
    case 'shipped':
    case 'in_transit':
      return 'bg-sky-600';
    case 'delivered':
    case 'arrived':
      return 'bg-emerald-600';
    case 'refunded':
      return 'bg-rose-600';
    default:
      return 'bg-slate-500';
  }
}

const receiptUrl = (sessionId: string) => `${API}/payments/receipt/${sessionId}.pdf`;

export default function DashboardPage() {
  const [userId, setUserId] = useState<string>(DEMO_USER);
  const [rows, setRows] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [justPaidSession, setJustPaidSession] = useState<string | null>(null);

  // read ?user=... and ?session_id=... from URL on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const sp = new URL(window.location.href).searchParams;
    const u = sp.get('user');
    const sid = sp.get('session_id');
    if (u) setUserId(u);
    if (sid) setJustPaidSession(sid);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/buyers/${userId}/shipments?limit=200`, { cache: 'no-store' });
      const j = await r.json();
      setRows(Array.isArray(j) ? j : []);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const base = rows.slice().sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
    if (!needle) return base;
    return base.filter((s) =>
      [
        s.itemId,
        s.originPort ?? '',
        s.destPort ?? '',
        s.mode ?? '',
        s.status,
        s.poolStatus ?? '',
        s.bookingRef ?? '',
      ]
        .join(' ')
        .toLowerCase()
        .includes(needle)
    );
  }, [rows, q]);

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="font-heading text-3xl font-bold tracking-tight">My shipments</h1>
        <div className="flex flex-wrap items-center gap-2">
          <Input
            placeholder="Buyer userId (UUID)"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className="w-[320px]"
          />
          <Input
            placeholder="Search (lane, status, ref)"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-[240px]"
          />
          <Button variant="outline" onClick={load}>
            Refresh
          </Button>
        </div>
      </div>

      {justPaidSession && (
        <Card className="mb-4 border-emerald-200 bg-emerald-50">
          <CardContent className="flex items-center justify-between p-4 text-sm">
            <div>
              Payment completed. You can{' '}
              <a
                className="underline"
                href={receiptUrl(justPaidSession)}
                target="_blank"
                rel="noreferrer"
              >
                download your receipt
              </a>
              .
            </div>
            <Button size="sm" variant="outline" onClick={() => setJustPaidSession(null)}>
              Dismiss
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {loading ? (
          <Card>
            <CardContent className="p-6">Loading…</CardContent>
          </Card>
        ) : filtered.length ? (
          filtered.map((s) => (
            <Card key={s.itemId}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="font-heading text-lg">
                  {s.originPort ?? '—'} → {s.destPort ?? '—'} {s.mode ? `(${s.mode})` : ''}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${statusColor(s.status)}`} />
                  {s.poolStatus && (
                    <Badge variant="outline" className="capitalize">
                      {s.poolStatus.replace(/_/g, ' ')}
                    </Badge>
                  )}
                  {s.status === 'paid' && <Badge className="bg-emerald-600">Paid</Badge>}
                  {s.status === 'pay_pending' && (
                    <Badge className="bg-amber-600">Payment pending</Badge>
                  )}
                  {s.status === 'refunded' && <Badge className="bg-rose-600">Refunded</Badge>}
                  {!['paid', 'pay_pending', 'refunded'].includes(s.status) && (
                    <span className="text-sm capitalize">{s.status.replace(/_/g, ' ')}</span>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                <div className="text-sm text-slate-600">
                  Item: <span className="font-mono">{s.itemId.slice(0, 8)}…</span> • Created:{' '}
                  {new Date(s.createdAt).toLocaleString()}
                  {s.cutoffISO && <> • Cut-off: {new Date(s.cutoffISO).toLocaleString()}</>}
                  {s.bookingRef && (
                    <>
                      {' '}
                      • Booking: <span className="font-mono">{s.bookingRef}</span>
                    </>
                  )}
                  {s.stripeSessionId && (
                    <>
                      {' '}
                      •{' '}
                      <a
                        className="underline"
                        href={receiptUrl(s.stripeSessionId)}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Download receipt
                      </a>
                    </>
                  )}
                </div>

                <div className="text-sm text-slate-600">
                  {s.weightKg} kg • {s.volumeM3.toFixed(2)} m³ • {s.length}×{s.width}×{s.height} cm
                </div>

                {s.fillPercent !== null && (
                  <div>
                    <div className="mb-1 text-xs text-slate-500">
                      Pool fill: {(s.fillPercent * 100).toFixed(0)}%
                    </div>
                    <Progress value={Math.round(s.fillPercent * 100)} />
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="p-6 text-slate-600">No shipments yet.</CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}
