'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

type Inbound = {
  id: string;
  hubCode: string;
  extTracking: string | null;
  sellerName: string | null;
  status: string;
  originPort: string;
  destPort: string;
  mode: 'air' | 'sea';
  receivedAt: string | null;
  poolId: string | null;
};

export default function HubAdminPage() {
  const [q, setQ] = useState('');
  const [rows, setRows] = useState<Inbound[]>([]);
  const [loading, setLoading] = useState(false);

  async function search() {
    if (!q.trim()) return;
    setLoading(true);
    // For MVP, we reuse user list endpoint if you know the user; otherwise add a tiny search endpoint later.
    // Placeholder: show nothing until dedicated search exists.
    setRows([]);
    setLoading(false);
  }

  useEffect(() => {
    // stub; implement search endpoint later
  }, []);

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <div className="mb-6">
        <h1 className="font-heading text-3xl font-bold">Hub admin (MVP)</h1>
        <p className="text-slate-600">Search by hub code or tracking (endpoint to add next).</p>
      </div>

      <div className="mb-4 flex gap-2">
        <Input
          placeholder="CTN-TH-XXXXXX or tracking"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Results</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {loading ? (
            <div className="text-slate-600">Loading…</div>
          ) : rows.length ? (
            rows.map((r) => (
              <div key={r.id} className="rounded border p-3 text-sm">
                <div className="flex items-center justify-between">
                  <div className="font-mono">{r.id.slice(0, 8)}…</div>
                  <div className="text-slate-600">
                    {r.originPort}→{r.destPort} ({r.mode})
                  </div>
                </div>
                <div className="text-slate-600">
                  {r.hubCode} {r.extTracking ? `• ${r.extTracking}` : ''}
                </div>
                <div className="text-slate-600 capitalize">{r.status.replace(/_/g, ' ')}</div>
              </div>
            ))
          ) : (
            <div className="text-slate-600">No results.</div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
