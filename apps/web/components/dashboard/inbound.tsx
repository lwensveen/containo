'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { z } from 'zod/v4';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { InboundEvent } from '@containo/types/dist/types/inbound';
import { InboundRow, money, STORAGE_CURRENCY, storageEstimate } from '@/lib/utils';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

type HubCode = { userId: string; hubCode: string; hubLocation: string };

const DeclareSchema = z.object({
  userId: z.string().uuid(),
  originPort: z.string().length(3),
  destPort: z.string().length(3),
  mode: z.enum(['sea', 'air']),
  sellerName: z.string().optional(),
  extTracking: z.string().optional(),
  notes: z.string().optional(),
});

type PriceQuote = {
  currency: 'USD';
  amountUsd: number;
  breakdown: {
    base: number;
    minApplied: boolean;
    serviceFee: number;
    chargeableKg?: number;
    volumeM3?: number;
    rateId?: string;
  };
};

export function InboundPanel({ userId }: { userId: string }) {
  const [hub, setHub] = useState<HubCode | null>(null);
  const [rows, setRows] = useState<InboundRow[]>([]);
  const [events, setEvents] = useState<InboundEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyDeclare, setBusyDeclare] = useState(false);
  const [log, setLog] = useState('');
  const [q, setQ] = useState('');
  const [quotes, setQuotes] = useState<Record<string, PriceQuote | { error: string }>>({});
  const [payBusy, setPayBusy] = useState<string | null>(null);
  const [payOpen, setPayOpen] = useState<{ id: string } | null>(null);
  const [payUsd, setPayUsd] = useState<string>('120'); // sensible default
  const [busyPay, setBusyPay] = useState(false);

  async function payPriority(inboundId: string) {
    setBusyPay(true);
    try {
      const amount = Math.max(1, Math.floor(Number(payUsd)));
      const body = {
        inboundId,
        amountUsd: amount,
        currency: 'USD',
        description: 'Priority ship (inbound)',
      };
      const r = await fetch(`${API}/payments/checkout`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
      const j = await r.json();
      if (!r.ok || !j?.url) throw new Error(`Checkout failed: ${r.status}`);
      window.location.href = j.url;
    } catch (e: any) {
      setLog(String(e?.message ?? e));
    } finally {
      setBusyPay(false);
    }
  }

  const [form, setForm] = useState({
    originPort: 'AMS',
    destPort: 'BKK',
    mode: 'sea' as 'sea' | 'air',
    sellerName: '',
    extTracking: '',
    notes: '',
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const hc = await fetch(`${API}/inbound/hub-code?userId=${encodeURIComponent(userId)}`, {
        cache: 'no-store',
      }).then((r) => r.json());
      setHub(hc ?? null);

      const list = await fetch(`${API}/inbound?userId=${encodeURIComponent(userId)}`, {
        cache: 'no-store',
      }).then((r) => r.json());
      setRows(Array.isArray(list) ? list : []);

      const ev = await fetch(
        `${API}/inbound/events?userId=${encodeURIComponent(userId)}&limit=500`,
        { cache: 'no-store' }
      ).then((r) => r.json());
      setEvents(Array.isArray(ev) ? ev : []);
    } catch (e: any) {
      setLog(String(e?.message ?? e));
      setRows([]);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const paidSet = useMemo(() => {
    const byInbound = new Map<string, InboundEvent>();
    for (const e of events) {
      const prev = byInbound.get(e.inboundId);
      if (!prev || new Date(e.createdAt) > new Date(prev.createdAt)) {
        byInbound.set(e.inboundId, e);
      }
    }
    return new Set(
      [...byInbound.entries()].filter(([_, e]) => e.type === 'priority_paid').map(([id]) => id)
    );
  }, [events]);

  useEffect(() => {
    if (!userId) return;
    load();
  }, [load, userId]);

  async function declareInbound() {
    setBusyDeclare(true);
    setLog('');
    try {
      const body = DeclareSchema.parse({
        userId,
        originPort: form.originPort.toUpperCase(),
        destPort: form.destPort.toUpperCase(),
        mode: form.mode,
        sellerName: form.sellerName || undefined,
        extTracking: form.extTracking || undefined,
        notes: form.notes || undefined,
      });
      const r = await fetch(`${API}/inbound/declare`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(JSON.stringify(j));
      setLog('Declared.');
      setForm((f) => ({ ...f, sellerName: '', extTracking: '', notes: '' }));
      await load();
    } catch (e: any) {
      setLog(String(e?.message ?? e));
    } finally {
      setBusyDeclare(false);
    }
  }

  async function shipNow(id: string) {
    setLog('');
    try {
      const r = await fetch(`${API}/inbound/${id}/ship-now`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(JSON.stringify(j));
      setLog('Priority shipping requested.');
      await load();
    } catch (e: any) {
      setLog(String(e?.message ?? e));
    }
  }

  async function getPrice(id: string) {
    setQuotes((q) => ({ ...q, [id]: { error: 'loading' as any } }));
    try {
      const r = await fetch(`${API}/inbound/${id}/price`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
      });
      const j = await r.json();
      if (!r.ok) {
        setQuotes((q) => ({ ...q, [id]: { error: j?.error ?? 'pricing_failed' } }));
        return;
      }
      setQuotes((q) => ({ ...q, [id]: j as PriceQuote }));
    } catch (e: any) {
      setQuotes((q) => ({ ...q, [id]: { error: e?.message ?? 'pricing_failed' } }));
    }
  }

  async function payInbound(row: InboundRow) {
    const q = quotes[row.id];
    if (!q || 'error' in q) return;
    setPayBusy(row.id);
    try {
      const desc = `Containo Inbound ${row.originPort}→${row.destPort} (${row.mode})`;
      const resp = await fetch(`${API}/payments/checkout`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          payInbound: row.id,
          amountUsd: Math.round(q.amountUsd),
          currency: q.currency,
          description: desc,
        }),
      });
      const j = await resp.json();
      if (!resp.ok || !j?.url) throw new Error('checkout_failed');
      window.location.href = j.url;
    } catch (e: any) {
      setLog(`Payment error: ${e?.message ?? e}`);
    } finally {
      setPayBusy(null);
    }
  }

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const base = rows.slice().sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
    if (!needle) return base;
    return base.filter((r) =>
      [
        r.id,
        r.sellerName ?? '',
        r.extTracking ?? '',
        r.originPort,
        r.destPort,
        r.mode,
        r.status,
        r.poolId ?? '',
      ]
        .join(' ')
        .toLowerCase()
        .includes(needle)
    );
  }, [rows, q]);

  const storageTotals = useMemo(() => {
    let amount = 0;
    let count = 0;
    for (const r of filtered) {
      const est = storageEstimate(r);
      if (est.days > 0) {
        amount += est.amount;
        count += 1;
      }
    }
    return { amount, count };
  }, [filtered]);

  const copyHubCode = async () => {
    if (!hub?.hubCode) return;
    await navigator.clipboard.writeText(hub.hubCode);
    setLog('Hub code copied.');
  };

  const swap = () => setForm((f) => ({ ...f, originPort: f.destPort, destPort: f.originPort }));

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Hub receiving code</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-md border px-3 py-2 font-mono text-base">
              {hub?.hubCode ?? '—'}
            </div>
            <Button variant="outline" onClick={copyHubCode} disabled={!hub?.hubCode}>
              Copy
            </Button>
            <div className="text-slate-600">
              Location: <span className="font-medium">{hub?.hubLocation ?? '—'}</span>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <Input readOnly value={userId} className="w-[320px]" title="User ID" />
              <Button variant="outline" onClick={load}>
                Refresh
              </Button>
            </div>
          </div>
          <p className="text-slate-600">
            Share this code with your seller. Ask them to put{' '}
            <span className="font-mono">“{hub?.hubCode ?? 'CTN-TH-XXXXXX'}”</span> on the label and
            include their tracking number.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Declare inbound parcel</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-3">
            <div>
              <Label className="mb-1 block">Origin (IATA)</Label>
              <Input
                value={form.originPort}
                onChange={(e) =>
                  setForm((f) => ({ ...f, originPort: e.target.value.toUpperCase() }))
                }
              />
            </div>
            <Button type="button" variant="outline" className="h-10 self-center" onClick={swap}>
              ↔
            </Button>
            <div>
              <Label className="mb-1 block">Destination (IATA)</Label>
              <Input
                value={form.destPort}
                onChange={(e) => setForm((f) => ({ ...f, destPort: e.target.value.toUpperCase() }))}
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <Label className="mb-1 block">Mode</Label>
              <select
                className="w-full rounded-md border px-3 py-2"
                value={form.mode}
                onChange={(e) => setForm((f) => ({ ...f, mode: e.target.value as 'sea' | 'air' }))}
              >
                <option value="sea">Sea</option>
                <option value="air">Air</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <Label className="mb-1 block">Seller name (optional)</Label>
              <Input
                value={form.sellerName}
                onChange={(e) => setForm((f) => ({ ...f, sellerName: e.target.value }))}
                placeholder="Antiques BV"
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <Label className="mb-1 block">External tracking (optional)</Label>
              <Input
                value={form.extTracking}
                onChange={(e) => setForm((f) => ({ ...f, extTracking: e.target.value }))}
                placeholder="DHL/UPS/GLS ref"
              />
            </div>
            <div>
              <Label className="mb-1 block">Notes</Label>
              <Input
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="Fragile / stacking OK?"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button onClick={declareInbound} disabled={busyDeclare}>
              {busyDeclare ? 'Declaring…' : 'Declare'}
            </Button>
            <div className="text-sm text-slate-600">{log}</div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Storage (estimated)</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-6 text-sm text-slate-700">
          <div>
            Accruing today on&nbsp;
            <span className="font-medium">{storageTotals.count}</span>
            &nbsp;parcel{storageTotals.count === 1 ? '' : 's'}
          </div>
          <div className="ml-4">
            Estimated total:&nbsp;
            <span className="font-semibold">{money(storageTotals.amount)}</span>
          </div>
          <div className="text-xs text-slate-500">
            Estimate = days overdue × (base/day + m³ × rate/day). Uses {STORAGE_CURRENCY}.
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>My inbound parcels</CardTitle>
          <div className="flex items-center gap-2">
            <Input
              placeholder="Search (seller, tracking, lane, status)"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="w-[280px]"
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="p-3 text-sm text-slate-600">Loading…</div>
          ) : filtered.length ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[160px]">Parcel</TableHead>
                    <TableHead>Lane</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Dims / Weight</TableHead>
                    <TableHead>Storage (est.)</TableHead>
                    <TableHead>Pool</TableHead>
                    <TableHead className="w-[150px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((r) => {
                    const q = quotes[r.id];
                    const canPrice =
                      r.status !== 'priority_requested' &&
                      r.lengthCm != null &&
                      r.widthCm != null &&
                      r.heightCm != null &&
                      r.weightKg != null;

                    return (
                      <TableRow key={r.id}>
                        <TableCell className="align-top">
                          <div className="font-mono text-xs">{r.id.slice(0, 8)}…</div>
                          <div className="text-xs text-slate-600">
                            {r.sellerName || '—'} {r.extTracking ? `• ${r.extTracking}` : ''}
                          </div>
                          <div className="text-xs text-slate-500">
                            {new Date(r.createdAt).toLocaleString()}
                          </div>
                        </TableCell>
                        <TableCell className="align-top">
                          {r.originPort} → {r.destPort} ({r.mode})
                        </TableCell>
                        <TableCell className="align-top">
                          <Badge
                            variant={r.status === 'expected' ? 'outline' : undefined}
                            className="capitalize"
                          >
                            {r.status.replace(/_/g, ' ')}
                          </Badge>
                          {r.freeUntilAt && (
                            <div className="mt-1 text-[11px] text-slate-500">
                              Free until {new Date(r.freeUntilAt).toLocaleString()}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="align-top">
                          <Badge
                            variant={r.status === 'expected' ? 'outline' : undefined}
                            className="capitalize"
                          >
                            {r.status.replace(/_/g, ' ')}
                          </Badge>
                          {paidSet.has(r.id) && (
                            <div className="mt-1">
                              <span className="rounded bg-emerald-600 px-2 py-0.5 text-[11px] text-white">
                                Paid
                              </span>
                            </div>
                          )}
                          {r.freeUntilAt && (
                            <div className="mt-1 text-[11px] text-slate-500">
                              Free until {new Date(r.freeUntilAt).toLocaleString()}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="align-top text-sm text-slate-700">
                          {r.lengthCm && r.widthCm && r.heightCm ? (
                            <div>
                              {r.lengthCm}×{r.widthCm}×{r.heightCm} cm
                            </div>
                          ) : (
                            <div className="text-slate-500">—</div>
                          )}
                          <div className="text-xs text-slate-500">
                            {r.weightKg ? `${Number(r.weightKg)} kg` : '—'}
                          </div>
                        </TableCell>
                        <TableCell className="align-top text-sm">
                          {(() => {
                            const est = storageEstimate(r);
                            if (est.days <= 0) {
                              return <span className="text-xs text-slate-500">Free</span>;
                            }
                            return (
                              <div>
                                <div className="font-medium">{money(est.amount)}</div>
                                <div className="text-xs text-slate-500">
                                  {est.days} day{est.days > 1 ? 's' : ''}{' '}
                                  {est.vol ? `• ${est.vol.toFixed(2)} m³` : '• —'}
                                </div>
                              </div>
                            );
                          })()}
                        </TableCell>
                        <TableCell className="align-top">
                          {r.poolId ? (
                            <code className="rounded bg-slate-50 px-1 py-0.5 text-xs">
                              {r.poolId.slice(0, 8)}…
                            </code>
                          ) : (
                            <span className="text-xs text-slate-500">—</span>
                          )}
                        </TableCell>
                        <TableCell className="align-top">
                          <div className="flex flex-col gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => shipNow(r.id)}
                              disabled={r.status === 'priority_requested'}
                            >
                              {r.status === 'priority_requested' ? 'Requested' : 'Ship now'}
                            </Button>

                            <Button
                              size="sm"
                              onClick={() => setPayOpen({ id: r.id })}
                              disabled={r.status === 'priority_requested'}
                            >
                              Pay now
                            </Button>

                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                onClick={() => getPrice(r.id)}
                                disabled={!canPrice}
                                title={canPrice ? '' : 'Awaiting measurement'}
                              >
                                {q && !('error' in q)
                                  ? `Price: $${Math.round(q.amountUsd)}`
                                  : 'Get price'}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => payInbound(r)}
                                disabled={!q || 'error' in q || payBusy === r.id}
                              >
                                {payBusy === r.id ? 'Redirecting…' : 'Pay with card'}
                              </Button>
                            </div>

                            {q && 'error' in q && q.error !== 'loading' ? (
                              <div className="text-xs text-amber-700">
                                {q.error === 'not_measured'
                                  ? 'Awaiting measurement'
                                  : q.error === 'no_rate'
                                    ? 'No rate configured'
                                    : 'Pricing failed'}
                              </div>
                            ) : null}

                            {r.poolId && (
                              <Link href="/(protected)/admin/pools" className="text-xs underline">
                                View pools
                              </Link>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="p-3 text-sm text-slate-600">No inbound parcels yet.</div>
          )}
        </CardContent>
      </Card>

      {payOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-lg bg-white p-4 shadow">
            <div className="mb-2 text-sm font-semibold">Priority ship — one-off payment</div>
            <label className="mb-1 block text-xs text-slate-600">Amount (USD)</label>
            <Input
              type="number"
              min={1}
              value={payUsd}
              onChange={(e) => setPayUsd(e.target.value)}
              className="mb-3"
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setPayOpen(null)} disabled={busyPay}>
                Cancel
              </Button>
              <Button onClick={() => payPriority(payOpen.id)} disabled={busyPay}>
                {busyPay ? 'Redirecting…' : 'Pay now'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
