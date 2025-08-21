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

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

type InboundRow = {
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
  const [loading, setLoading] = useState(true);
  const [busyDeclare, setBusyDeclare] = useState(false);
  const [log, setLog] = useState('');
  const [q, setQ] = useState('');

  const [quotes, setQuotes] = useState<Record<string, PriceQuote | { error: string }>>({}); // NEW
  const [payBusy, setPayBusy] = useState<string | null>(null); // NEW

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
    } catch (e: any) {
      setLog(String(e?.message ?? e));
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

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
          itemId: row.id,
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

      {/* Listing */}
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
                    <TableHead>Pool</TableHead>
                    <TableHead className="w-[210px]">Actions</TableHead> {/* NEW width */}
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

                            {/* NEW: price + pay */}
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
    </div>
  );
}
