'use client';

import { useEffect, useState } from 'react';
import type { Pool } from '@containo/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export default function AdminPoolsPage() {
  const [pools, setPools] = useState<Pool[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const r = await fetch(`${API}/pools/`, { cache: 'no-store' });
    const arr = await r.json();
    setPools(arr);
    setLoading(false);
  }
  useEffect(() => {
    load();
  }, []);

  async function setStatus(id: string, status: Pool['status']) {
    const r = await fetch(`${API}/pools/${id}/status`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (r.ok) load();
  }

  const pct = (p: Pool) => {
    const used = Number(p.usedM3),
      cap = Number(p.capacityM3);
    if (!cap || isNaN(used) || isNaN(cap)) return 0;
    return Math.min(100, Math.round((used / cap) * 100));
  };

  if (loading) return <main className="p-6">Loading…</main>;

  return (
    <main className="mx-auto max-w-5xl p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Pools</h1>
        <Button variant="outline" onClick={load}>
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {pools.map((p) => (
          <Card key={p.id}>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>
                {p.originPort} → {p.destPort} ({p.mode})
              </CardTitle>
              <span className="text-sm capitalize">{p.status}</span>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm text-slate-600">
                Cutoff: {new Date(p.cutoffISO).toLocaleString()} • Fill: {pct(p)}%
              </div>
              <div className="flex flex-wrap gap-2">
                {['closing', 'booked', 'in_transit', 'arrived'].map((s) => (
                  <Button
                    key={s}
                    size="sm"
                    variant="outline"
                    onClick={() => setStatus(p.id, s as any)}
                  >
                    {s}
                  </Button>
                ))}
                <a className="ml-auto text-sm underline" href={`${API}/pools/${p.id}/items.csv`}>
                  Export CSV
                </a>
                <Link className="text-sm underline" href={`/admin/pools/${p.id}`}>
                  Details
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  );
}
