'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
const DEMO_USER = process.env.NEXT_PUBLIC_DEMO_USER_ID ?? '00000000-0000-0000-0000-000000000000';

type Inbound = {
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
  status: 'expected' | 'received' | 'staged_to_cfs' | 'manifested' | 'departed' | 'canceled';
  receivedAt: string | null;
  freeUntilAt: string | null;
  photoUrl: string | null;
  notes: string | null;
  createdAt: string;
};

type Hub = { userId: string; hubCode: string; hubLocation: string };

const toLocal = (iso: string) => new Date(iso).toLocaleString();
const daysLeft = (freeUntil: string | null) => {
  if (!freeUntil) return null;
  const ms = new Date(freeUntil).getTime() - Date.now();
  return Math.ceil(ms / 86400000);
};

export default function InboundPage() {
  const [userId, setUserId] = useState<string>(DEMO_USER);
  const [hub, setHub] = useState<Hub | null>(null);
  const [rows, setRows] = useState<Inbound[]>([]);
  const [loading, setLoading] = useState(true);
  const [declaring, setDeclaring] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [hubR, listR] = await Promise.all([
      fetch(`${API}/inbound/hub-code?userId=${encodeURIComponent(userId)}`, { cache: 'no-store' }),
      fetch(`${API}/inbound?userId=${encodeURIComponent(userId)}`, { cache: 'no-store' }),
    ]);
    setHub((await hubR.json()) as Hub);
    setRows((await listR.json()) as Inbound[]);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    load();
  }, [load, userId]);

  const expected = useMemo(() => rows.filter((r) => r.status === 'expected'), [rows]);
  const received = useMemo(() => rows.filter((r) => r.status === 'received'), [rows]);
  const others = useMemo(
    () => rows.filter((r) => r.status !== 'expected' && r.status !== 'received'),
    [rows]
  );

  async function declare(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setDeclaring(true);
    const fd = new FormData(e.currentTarget);
    const body = {
      userId,
      originPort: String(fd.get('originPort') || 'AMS').toUpperCase(),
      destPort: String(fd.get('destPort') || 'BKK').toUpperCase(),
      mode: String(fd.get('mode') || 'air') as 'air' | 'sea',
      sellerName: String(fd.get('sellerName') || ''),
      extTracking: String(fd.get('extTracking') || ''),
      notes: String(fd.get('notes') || ''),
    };
    await fetch(`${API}/inbound/declare`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
    (e.currentTarget as HTMLFormElement).reset();
    await load();
    setDeclaring(false);
  }

  async function shipNow(id: string) {
    await fetch(`${API}/inbound/${id}/ship-now`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    // For MVP we just tag the event; you can redirect to checkout later
    await load();
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-heading text-3xl font-bold tracking-tight">Inbound @ Origin</h1>
        <Input
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          placeholder="User UUID"
          className="w-[360px]"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Origin hub address</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {hub ? (
              <>
                <div>
                  <div className="text-slate-500">Hub location</div>
                  <div className="font-medium">{hub.hubLocation}</div>
                </div>
                <div className="rounded-lg bg-slate-50 p-3 ring-1 ring-slate-900/10">
                  <div className="text-slate-500">Your hub code</div>
                  <div className="font-mono text-base font-semibold">{hub.hubCode}</div>
                </div>
                <p className="text-slate-600">
                  Ship any EU orders to our hub and include your code in Address Line 2 or the
                  reference field. We’ll receive, stage (free 7 days), and move on the next cutoff.
                </p>
              </>
            ) : (
              <div className="text-slate-600">Loading…</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Declare an expected parcel</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="grid gap-3" onSubmit={declare}>
              <div className="grid grid-cols-3 gap-3">
                <Input name="originPort" placeholder="Origin (IATA) e.g. AMS" defaultValue="AMS" />
                <Input name="destPort" placeholder="Dest (IATA) e.g. BKK" defaultValue="BKK" />
                <select name="mode" className="h-10 rounded-md border px-3">
                  <option value="air">Air</option>
                  <option value="sea">Sea</option>
                </select>
              </div>
              <Input name="sellerName" placeholder="Seller / shop (optional)" />
              <Input name="extTracking" placeholder="External tracking (optional)" />
              <Input name="notes" placeholder="Notes (optional)" />
              <Button disabled={declaring}>{declaring ? 'Adding…' : 'Add expected'}</Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Received at hub</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {received.length ? (
              received.map((p) => (
                <div key={p.id} className="rounded border p-3 text-sm">
                  <div className="flex items-center justify-between">
                    <div className="font-mono">{p.id.slice(0, 8)}…</div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="capitalize">
                        {p.mode}
                      </Badge>
                      <span className="text-slate-600">
                        {p.originPort} → {p.destPort}
                      </span>
                    </div>
                  </div>
                  <div className="text-slate-600">
                    Received: {p.receivedAt ? toLocal(p.receivedAt) : '—'}
                    {p.freeUntilAt && (
                      <>
                        {' '}
                        • Free until: {toLocal(p.freeUntilAt)}{' '}
                        <span className="ml-1 rounded bg-slate-100 px-1">
                          {daysLeft(p.freeUntilAt)}d left
                        </span>
                      </>
                    )}
                  </div>
                  <div className="text-slate-600">
                    {p.lengthCm ?? '—'}×{p.widthCm ?? '—'}×{p.heightCm ?? '—'} cm •{' '}
                    {p.weightKg ? `${Number(p.weightKg)} kg` : '—'}
                  </div>
                  <div className="mt-2">
                    <Button size="sm" onClick={() => shipNow(p.id)}>
                      Ship now (priority)
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-slate-600">Nothing received yet.</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Expected (declared)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {expected.length ? (
              expected.map((p) => (
                <div key={p.id} className="rounded border p-3 text-sm">
                  <div className="flex items-center justify-between">
                    <div className="font-mono">{p.id.slice(0, 8)}…</div>
                    <Badge variant="secondary">Expected</Badge>
                  </div>
                  <div className="text-slate-600">
                    {p.originPort} → {p.destPort} ({p.mode})
                  </div>
                  <div className="text-slate-600">
                    {p.sellerName ?? '—'} {p.extTracking ? `• ${p.extTracking}` : ''}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-slate-600">No expected parcels declared.</div>
            )}
          </CardContent>
        </Card>
      </div>

      {others.length ? (
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>In progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {others.map((p) => (
                <div key={p.id} className="rounded border p-3 text-sm">
                  <div className="flex items-center justify-between">
                    <div className="font-mono">{p.id.slice(0, 8)}…</div>
                    <Badge className="capitalize">{p.status.replace(/_/g, ' ')}</Badge>
                  </div>
                  <div className="text-slate-600">
                    {p.originPort} → {p.destPort} ({p.mode})
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      ) : null}
    </main>
  );
}
