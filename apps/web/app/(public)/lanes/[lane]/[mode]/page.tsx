'use client';

import { useEffect, useMemo, useState } from 'react';
import { notFound, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

type NextLanePool = {
  id: string;
  originPort: string;
  destPort: string;
  mode: 'air' | 'sea';
  cutoffISO: string;
  capacityM3: string;
  usedM3: string;
  status: string;
  fillPercent: number;
  secondsToCutoff: number;
};

function fmtDur(s: number) {
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  return `${d}d ${h}h ${m}m`;
}

export default function LanePage() {
  const { lane, mode } = useParams<{ lane: string; mode: 'air' | 'sea' }>();
  const [data, setData] = useState<NextLanePool | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [now, setNow] = useState<number>(Date.now());

  useEffect(() => {
    const [o, d] = lane.split('-');
    if (!o || !d) {
      setErr('bad_lane');
      return;
    }
    fetch(
      `${API}/lanes/next?originPort=${encodeURIComponent(o.toUpperCase())}&destPort=${encodeURIComponent(
        d.toUpperCase()
      )}&mode=${encodeURIComponent(mode)}`,
      { cache: 'no-store' }
    )
      .then(async (r) => (r.ok ? r.json() : Promise.reject(await r.json())))
      .then((j) => setData(j as NextLanePool))
      .catch((e) => setErr(e?.error ?? String(e)));
  }, [lane, mode]);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);

  const secondsLeft = useMemo(() => {
    if (!data) return 0;
    const cutoff = new Date(data.cutoffISO).getTime();
    return Math.max(0, Math.floor((cutoff - now) / 1000));
  }, [data, now]);

  if (err === 'bad_lane') return notFound();

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="font-heading text-3xl font-bold tracking-tight">
        {lane.toUpperCase()} ({mode})
      </h1>
      <p className="mt-1 text-slate-600">
        Next pooled departure. Reserve your space or send inbound to our EU hub.
      </p>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Cut-off & progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {data ? (
              <>
                <div>
                  <div className="text-slate-500">Cut-off</div>
                  <div className="font-medium">
                    {new Date(data.cutoffISO).toLocaleString()}
                    <span className="ml-2 rounded bg-slate-100 px-2 py-0.5 text-xs">
                      {fmtDur(secondsLeft)} left
                    </span>
                  </div>
                </div>
                <div>
                  <div className="text-slate-500">Pool fill</div>
                  <div className="flex items-center gap-3">
                    <Progress value={Math.round((data.fillPercent ?? 0) * 100)} />
                    <div className="w-14 text-right font-medium">
                      {Math.round((data.fillPercent ?? 0) * 100)}%
                    </div>
                  </div>
                  <div className="text-slate-500">
                    {Number(data.usedM3).toFixed(1)} / {Number(data.capacityM3).toFixed(1)} m³
                  </div>
                </div>
              </>
            ) : err ? (
              <div className="text-slate-600">No open pool yet for this lane.</div>
            ) : (
              <div className="text-slate-600">Loading…</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Get started</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-slate-600">
              Ship your EU purchases to our hub; we stage (free window) and load on this cutoff.
            </p>
            <div className="flex gap-2">
              <Link href="/account/inbound">
                <Button>Declare inbound</Button>
              </Link>
              <Link href="/quote">
                <Button variant="outline">Instant quote</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
