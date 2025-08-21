'use client';

import { useCallback, useEffect, useState } from 'react';
import { z } from 'zod/v4';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Badge } from '@/components/ui/badge';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

const CreatePoolSchema = z.object({
  originPort: z.string().trim().length(3),
  destPort: z.string().trim().length(3),
  mode: z.enum(['air', 'sea']),
  cutoffISO: z.string().min(10),
  capacityM3: z.coerce.number().positive(),
  bookingRef: z.string().optional(),
});

type PoolRow = {
  id: string;
  originPort: string;
  destPort: string;
  mode: 'air' | 'sea';
  cutoffISO: string;
  capacityM3: string;
  usedM3: string;
  status: 'open' | 'closing' | 'booked' | 'in_transit' | 'arrived';
  bookingRef: string | null;
  createdAt?: string;
  updatedAt?: string;
};

const toLocalInputValue = (iso: string) => {
  const d = new Date(iso);
  const off = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - off).toISOString().slice(0, 16);
};
const toISOFromLocal = (local: string) => new Date(local).toISOString();

export default function AdminLanesPage() {
  const [form, setForm] = useState({
    originPort: 'AMS',
    destPort: 'BKK',
    mode: 'sea' as 'sea' | 'air',
    cutoffISO: new Date(Date.now() + 21 * 86400_000).toISOString(),
    capacityM3: 28,
    bookingRef: '',
  });

  const [rows, setRows] = useState<PoolRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<
    'open' | 'closing' | 'booked' | 'in_transit' | 'arrived' | 'all'
  >('open');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const qp = new URLSearchParams();
      if (filterStatus !== 'all') qp.set('status', filterStatus);
      const r = await fetch(`${API}/lanes/pools?${qp.toString()}`, { cache: 'no-store' });
      const j = await r.json();
      setRows(Array.isArray(j) ? j : []);
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => {
    load();
  }, [load]);

  async function onCreate() {
    setBusy(true);
    setErr(null);
    try {
      const parsed = CreatePoolSchema.parse({
        ...form,
        originPort: form.originPort.toUpperCase(),
        destPort: form.destPort.toUpperCase(),
        cutoffISO: form.cutoffISO,
      });
      const r = await fetch(`${API}/lanes/pools`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(parsed),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(JSON.stringify(j));
      await load();
    } catch (e: any) {
      setErr(String(e?.message ?? e));
    } finally {
      setBusy(false);
    }
  }

  async function updateStatus(id: string, status: PoolRow['status']) {
    const r = await fetch(`${API}/lanes/pools/${id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (r.ok) load();
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-6">
        <h1 className="font-heading text-3xl font-bold tracking-tight">Lanes / Pools</h1>
        <p className="text-slate-600">Create scheduled pool cut-offs and manage their status.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Create pool</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {err && (
              <div className="rounded border border-red-200 bg-red-50 p-2 text-sm text-red-800">
                {err}
              </div>
            )}

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
              <Button
                type="button"
                variant="outline"
                className="h-10 self-center"
                onClick={() =>
                  setForm((f) => ({ ...f, originPort: f.destPort, destPort: f.originPort }))
                }
              >
                ↔
              </Button>
              <div>
                <Label className="mb-1 block">Destination (IATA)</Label>
                <Input
                  value={form.destPort}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, destPort: e.target.value.toUpperCase() }))
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="mb-1 block">Mode</Label>
                <Select
                  value={form.mode}
                  onValueChange={(v) => setForm((f) => ({ ...f, mode: v as 'air' | 'sea' }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sea">Sea</SelectItem>
                    <SelectItem value="air">Air</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-1 block">Cut-off (local)</Label>
                <Input
                  type="datetime-local"
                  value={toLocalInputValue(form.cutoffISO)}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, cutoffISO: toISOFromLocal(e.target.value) }))
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="mb-1 block">Capacity (m³)</Label>
                <Input
                  type="number"
                  inputMode="decimal"
                  value={form.capacityM3}
                  onChange={(e) => setForm((f) => ({ ...f, capacityM3: Number(e.target.value) }))}
                />
              </div>
              <div>
                <Label className="mb-1 block">Booking ref (optional)</Label>
                <Input
                  value={form.bookingRef}
                  onChange={(e) => setForm((f) => ({ ...f, bookingRef: e.target.value }))}
                />
              </div>
            </div>

            <Button onClick={onCreate} disabled={busy}>
              {busy ? 'Creating…' : 'Create pool'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Existing pools</CardTitle>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-slate-500">Status</span>
              <select
                className="rounded border px-2 py-1"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
              >
                <option value="open">open</option>
                <option value="closing">closing</option>
                <option value="booked">booked</option>
                <option value="in_transit">in_transit</option>
                <option value="arrived">arrived</option>
                <option value="all">all</option>
              </select>
              <Button variant="outline" size="sm" onClick={load}>
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {loading ? (
              <div className="text-slate-600">Loading…</div>
            ) : rows.length ? (
              rows.map((p) => {
                const fill = Math.round(
                  (Number(p.usedM3) / Math.max(1, Number(p.capacityM3))) * 100
                );
                return (
                  <div key={p.id} className="rounded border p-3 text-sm">
                    <div className="flex items-center justify-between">
                      <div className="font-heading text-base">
                        {p.originPort} → {p.destPort} ({p.mode})
                      </div>
                      <Badge variant="outline" className="capitalize">
                        {p.status.replace(/_/g, ' ')}
                      </Badge>
                    </div>
                    <div className="text-slate-600">
                      Cut-off: {new Date(p.cutoffISO).toLocaleString()} • Fill: {fill}% (
                      {Number(p.usedM3).toFixed(1)} / {Number(p.capacityM3).toFixed(1)} m³)
                    </div>
                    <div className="mt-2 flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateStatus(p.id, 'closing')}
                      >
                        Mark closing
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateStatus(p.id, 'booked')}
                      >
                        Mark booked
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateStatus(p.id, 'in_transit')}
                      >
                        In transit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateStatus(p.id, 'arrived')}
                      >
                        Arrived
                      </Button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-slate-600">No pools.</div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
