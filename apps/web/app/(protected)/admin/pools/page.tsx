'use client';

import { useEffect, useState } from 'react';
import type { Pool } from '@containo/types';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Container } from '@/components/layout/container';
import { Section } from '@/components/layout/section';

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
    if (r.ok) await load();
  }

  const pct = (p: Pool) => {
    const used = Number(p.usedM3),
      cap = Number(p.capacityM3);
    if (!cap || isNaN(used) || isNaN(cap)) return 0;
    return Math.min(100, Math.round((used / cap) * 100));
  };

  if (loading) return <main className="p-6">Loading…</main>;

  return (
    <main>
      <Section className="py-8">
        <Container className="max-w-6xl">
          <div className="mb-6 flex items-center justify-between">
            <h1 className="font-heading text-2xl font-bold">Pools</h1>
            <div className="flex gap-2">
              <Link href="/quote">
                <Button variant="outline">Create demand</Button>
              </Link>
              <Button variant="outline" onClick={load}>
                Refresh
              </Button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {pools.map((p) => (
              <Card key={p.id} className="border-slate-200/70">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="font-heading text-lg">
                    {p.originPort} → {p.destPort} ({p.mode})
                  </CardTitle>
                  <span className="text-sm capitalize">{p.status}</span>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-sm text-slate-600">
                    Cutoff: {new Date(p.cutoffAt).toLocaleString()} • Fill: {pct(p)}%
                  </div>
                  <Progress value={pct(p)} className="h-2" />
                  <div className="flex flex-wrap items-center gap-2">
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
                    <a
                      className="ml-auto text-sm underline"
                      href={`${API}/pools/${p.id}/items.csv`}
                    >
                      Export CSV
                    </a>
                    <Link
                      className="text-sm underline"
                      href={`/apps/web/app/(protected)/admin/pools/${p.id}`}
                    >
                      Details
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
            {!pools.length && <div className="text-sm text-slate-600">No pools yet.</div>}
          </div>
        </Container>
      </Section>
    </main>
  );
}
