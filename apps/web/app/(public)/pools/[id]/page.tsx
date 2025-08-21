'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

type PublicPool = {
  id: string;
  originPort: string;
  destPort: string;
  mode: 'air' | 'sea';
  cutoffAt: string;
  status: string;
  capacityM3: string;
  usedM3: string;
  fillPercent: number;
  secondsToCutoff: number;
};

export default function PoolPublicPage() {
  const params = useParams<{ id: string }>();
  const [data, setData] = useState<PublicPool | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const id = params.id;
    (async () => {
      try {
        const r = await fetch(`${API}/pools/${id}/public`, { cache: 'no-store' });
        const j = await r.json();
        if (!r.ok) throw new Error(j?.message || `HTTP ${r.status}`);
        setData(j);
      } catch (e: any) {
        setErr(String(e?.message ?? e));
      }
    })();
  }, [params.id]);

  if (err) return <main className="p-6 text-sm text-rose-700">{err}</main>;
  if (!data) return <main className="p-6 text-sm text-slate-600">Loading…</main>;

  const pct = Math.round((data.fillPercent || 0) * 100);
  const cutoffLocal = new Date(data.cutoffAt).toLocaleString();

  return (
    <main className="mx-auto max-w-3xl p-6">
      <Card>
        <CardHeader>
          <CardTitle className="font-heading">
            {data.originPort} → {data.destPort} ({data.mode})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-600">
              Cut-off: <span className="font-medium">{cutoffLocal}</span>
            </div>
            <Badge className="capitalize">{data.status.replace(/_/g, ' ')}</Badge>
          </div>

          <div className="rounded-md border p-3">
            <div className="mb-2 flex justify-between text-sm">
              <div>Fill</div>
              <div>{pct}%</div>
            </div>
            <div className="h-3 w-full rounded bg-slate-100">
              <div
                className="h-3 rounded bg-blue-600"
                style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
              />
            </div>
            <div className="mt-2 text-xs text-slate-500">
              Used {Number(data.usedM3).toFixed(2)} / {Number(data.capacityM3).toFixed(2)} m³
            </div>
          </div>

          <div className="flex gap-3">
            <Link
              href={{
                pathname: '/quote',
                query: {
                  origin: data.originPort,
                  dest: data.destPort,
                  mode: data.mode,
                  cutoff: data.cutoffAt,
                },
              }}
            >
              <Button>Get a price on this pool</Button>
            </Link>
            <Link href="/pricing">
              <Button variant="outline">See pricing</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
