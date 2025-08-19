'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

type Pickup = {
  id: string;
  userId: string;
  contactName: string;
  address1: string;
  city: string;
  postcode: string;
  country: string;
  windowStartAt: string;
  windowEndAt: string;
  pieces: number;
  totalWeightKg: number;
  status: 'requested' | 'scheduled' | 'picked_up' | 'canceled';
  carrierRef?: string | null;
  labelUrl?: string | null;
  createdAt: string;
};

export default function AdminPickupsPage() {
  const [rows, setRows] = useState<Pickup[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');

  async function load() {
    setLoading(true);
    try {
      const r = await fetch(`${API}/pickups?limit=200`, { cache: 'no-store' });
      const j = await r.json();
      setRows(Array.isArray(j) ? j : []);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  async function schedule(id: string) {
    const key = localStorage.getItem('x-admin-token') || prompt('Admin token') || '';
    if (!key) return;

    const res = await fetch(`${API}/pickups/${id}/schedule`, {
      method: 'POST',
      headers: { 'x-admin-token': key },
    });
    if (!res.ok) {
      const t = await res.text();
      return alert(`Schedule failed: ${res.status} ${t}`);
    }
    await load();
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = rows
    .filter((p) => {
      const needle = q.trim().toLowerCase();
      if (!needle) return true;
      return (
        p.id.toLowerCase().includes(needle) ||
        p.userId.toLowerCase().includes(needle) ||
        p.contactName.toLowerCase().includes(needle) ||
        p.city.toLowerCase().includes(needle) ||
        p.postcode.toLowerCase().includes(needle)
      );
    })
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h1 className="font-heading text-2xl font-bold">Pickups</h1>
        <div className="flex items-center gap-2">
          <Input
            placeholder="Search id / user / city"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-[280px]"
          />
          <Button variant="outline" onClick={load}>
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {loading ? (
          <Card>
            <CardContent className="p-6">Loading…</CardContent>
          </Card>
        ) : filtered.length ? (
          filtered.map((p) => (
            <Card key={p.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle className="font-heading text-lg">
                  {p.contactName} — {p.city} {p.postcode} ({p.country})
                </CardTitle>
                <Badge className="capitalize">{p.status.replace(/_/g, ' ')}</Badge>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-slate-700">
                <div className="text-slate-600">
                  Window: {new Date(p.windowStartAt).toLocaleString()} →{' '}
                  {new Date(p.windowEndAt).toLocaleString()}
                </div>
                <div className="text-slate-600">
                  {p.pieces} pcs • {p.totalWeightKg} kg
                  {p.carrierRef ? (
                    <>
                      {' '}
                      • Ref: <span className="font-mono">{p.carrierRef}</span>
                    </>
                  ) : null}
                  {p.labelUrl ? (
                    <>
                      {' '}
                      •{' '}
                      <a className="underline" href={p.labelUrl} target="_blank" rel="noreferrer">
                        Label
                      </a>
                    </>
                  ) : null}
                </div>
                <div className="flex gap-2 pt-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => schedule(p.id)}
                    disabled={p.status !== 'requested'}
                  >
                    Schedule (mock)
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="p-6 text-slate-600">No pickups.</CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}
