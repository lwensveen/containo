'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
const DEMO_USER = process.env.NEXT_PUBLIC_DEMO_USER_ID ?? '00000000-0000-0000-0000-000000000000';

type Shipment = {
  itemId: string;
  poolId: string | null;
  status: string;
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
  poolStatus: string | null;
  capacityM3: number | null;
  usedM3: number | null;
  fillPercent: number | null;
};

export default function DashboardPage() {
  const [userId] = useState<string>(DEMO_USER);
  const [rows, setRows] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const r = await fetch(`${API}/buyers/${userId}/shipments?limit=200`, { cache: 'no-store' });
      const j = await r.json();
      setRows(Array.isArray(j) ? j : []);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="font-heading text-3xl font-bold tracking-tight">My shipments</h1>
        <Button variant="outline" onClick={load}>
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {loading ? (
          <Card>
            <CardContent className="p-6">Loading…</CardContent>
          </Card>
        ) : rows.length ? (
          rows.map((s) => (
            <Card key={s.itemId}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="font-heading text-lg">
                  {s.originPort ?? '—'} → {s.destPort ?? '—'} {s.mode ? `(${s.mode})` : ''}
                </CardTitle>
                <span className="text-sm capitalize">{s.poolStatus ?? s.status}</span>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm text-slate-600">
                  Item: <span className="font-mono">{s.itemId.slice(0, 8)}…</span> • &nbsp;Created:{' '}
                  {new Date(s.createdAt).toLocaleString()}
                  {s.cutoffISO && <> • Cut-off: {new Date(s.cutoffISO).toLocaleString()}</>}
                </div>

                <div className="text-sm text-slate-600">
                  {s.weightKg} kg • {s.volumeM3.toFixed(2)} m³ • {s.length}×{s.width}×{s.height} cm
                </div>

                {s.fillPercent !== null && (
                  <div>
                    <div className="mb-1 text-xs text-slate-500">
                      Pool fill: {(s.fillPercent * 100).toFixed(0)}%
                    </div>
                    <Progress value={Math.round(s.fillPercent * 100)} />
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="p-6 text-slate-600">No shipments yet.</CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}
