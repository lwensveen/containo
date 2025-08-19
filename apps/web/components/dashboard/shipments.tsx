'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Metric } from '@/components/dashboard/metric';
import { ShipmentCard } from '@/components/dashboard/shipment-card';
import { SkeletonCard } from './skeleton-card';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export type Shipment = {
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

type StatusFilter =
  | 'all'
  | 'pending'
  | 'pooled'
  | 'pay_pending'
  | 'paid'
  | 'in_transit'
  | 'delivered'
  | 'refunded';

const receiptUrl = (sessionId: string) => `${API}/payments/receipt/${sessionId}.pdf`;

export function ShipmentsPanel({ userId }: { userId: string }) {
  const [rows, setRows] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [auto, setAuto] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [justPaidSession, setJustPaidSession] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const sid = new URL(window.location.href).searchParams.get('session_id');
    if (sid) setJustPaidSession(sid);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const r = await fetch(`${API}/buyers/${userId}/shipments?limit=200`, { cache: 'no-store' });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const j = await r.json();
      setRows(Array.isArray(j) ? j : []);
    } catch (e: any) {
      setRows([]);
      setErr(e?.message ?? 'Failed to load shipments');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);
  useEffect(() => {
    if (!auto) return;
    const id = setInterval(load, 20_000);
    return () => clearInterval(id);
  }, [auto, load]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const base = rows.slice().sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
    const byStatus = base.filter((s) => {
      if (status === 'all') return true;
      if (status === 'in_transit') return s.status === 'shipped' || s.poolStatus === 'in_transit';
      if (status === 'delivered') return s.status === 'delivered' || s.poolStatus === 'arrived';
      return s.status === status;
    });
    if (!needle) return byStatus;
    return byStatus.filter((s) =>
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
  }, [rows, q, status]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [totalPages, page]);
  const pageItems = filtered.slice((page - 1) * pageSize, page * pageSize);

  const metrics = useMemo(() => {
    const total = rows.length;
    const inTransit = rows.filter(
      (s) => s.status === 'shipped' || s.poolStatus === 'in_transit'
    ).length;
    const delivered = rows.filter(
      (s) => s.status === 'delivered' || s.poolStatus === 'arrived'
    ).length;
    const awaitingPay = rows.filter((s) => s.status === 'pay_pending').length;
    return { total, inTransit, delivered, awaitingPay };
  }, [rows]);

  function exportCsv() {
    const cols = [
      'createdAt',
      'itemId',
      'originPort',
      'destPort',
      'mode',
      'status',
      'poolStatus',
      'weightKg',
      'volumeM3',
      'length',
      'width',
      'height',
      'bookingRef',
    ] as const;
    const lines = [
      cols.join(','),
      ...filtered.map((s) =>
        cols
          .map((k) => {
            const v = (s as any)[k];
            const cell = v == null ? '' : String(v);
            return /[",\n]/.test(cell) ? `"${cell.replace(/"/g, '""')}"` : cell;
          })
          .join(',')
      ),
    ].join('\n');
    const blob = new Blob([lines], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `shipments-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  }

  return (
    <>
      <div className="mb-4 grid gap-2 md:grid-cols-[1fr_1fr_auto_auto]">
        <Input
          placeholder="Search (lane, status, ref)"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <Select
          value={status}
          onValueChange={(v: StatusFilter) => {
            setStatus(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="pooled">Pooled</SelectItem>
            <SelectItem value="pay_pending">Payment pending</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="in_transit">In transit</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
            <SelectItem value="refunded">Refunded</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={String(pageSize)}
          onValueChange={(v) => {
            setPageSize(Number(v));
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[120px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[8, 12, 16, 24].map((n) => (
              <SelectItem key={n} value={String(n)}>
                {n}/page
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center justify-end gap-3">
          <div className="flex items-center gap-2">
            <Label className="text-xs text-slate-500">Auto-refresh</Label>
            <Switch checked={auto} onCheckedChange={setAuto} />
          </div>
          <Button variant="outline" onClick={load}>
            Refresh
          </Button>
          <Button variant="outline" onClick={exportCsv}>
            Export CSV
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

      <div className="mb-4 grid gap-3 sm:grid-cols-4">
        <Metric title="Total" value={metrics.total} />
        <Metric title="In transit" value={metrics.inTransit} />
        <Metric title="Delivered" value={metrics.delivered} />
        <Metric title="Payment pending" value={metrics.awaitingPay} />
      </div>

      {err ? (
        <Card className="mb-4 border-rose-200 bg-rose-50">
          <CardContent className="p-4 text-sm text-rose-700">
            {err} — check API URL or user ID.
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
        ) : pageItems.length ? (
          pageItems.map((s) => <ShipmentCard key={s.itemId} s={s} />)
        ) : (
          <Card>
            <CardContent className="p-6 text-slate-600">No shipments yet.</CardContent>
          </Card>
        )}
      </div>

      <div className="mt-6 flex items-center justify-between text-sm text-slate-600">
        <div>
          Page {page} of {totalPages} • {filtered.length} result{filtered.length === 1 ? '' : 's'}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
          >
            Prev
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
          >
            Next
          </Button>
        </div>
      </div>
    </>
  );
}
