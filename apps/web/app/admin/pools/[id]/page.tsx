export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { PoolItem } from '@containo/types';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

async function getItems(id: string): Promise<PoolItem[]> {
  const r = await fetch(`${API}/pools/${id}/items`, { cache: 'no-store' });
  if (!r.ok) return [];
  return r.json();
}

async function setStatus(id: string, status: string) {
  'use server';
  await fetch(`${API}/pools/${id}/status`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ status }),
    cache: 'no-store',
  });
}

export default async function PoolDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const items = await getItems(id);
  if (!items) notFound();

  return (
    <main className="mx-auto max-w-5xl p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Pool {id.slice(0, 8)}…</h1>
        <div className="flex items-center gap-2">
          <a className="text-sm underline" href={`${API}/pools/${id}/items.csv`}>
            Export CSV
          </a>
          <Link className="text-sm underline" href="/admin/pools">
            Back to pools
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Items</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="border-b bg-slate-50 text-left">
              <tr>
                <th className="p-2">Item</th>
                <th className="p-2">User</th>
                <th className="p-2">Weight (kg)</th>
                <th className="p-2">Vol (m³)</th>
                <th className="p-2">Dims (cm)</th>
                <th className="p-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it) => (
                <tr key={it.id} className="border-b">
                  <td className="p-2 font-mono">{it.id.slice(0, 8)}…</td>
                  <td className="p-2">{it.userId ?? '-'}</td>
                  <td className="p-2">{it.weightKg}</td>
                  <td className="p-2">{it.volumeM3}</td>
                  <td className="p-2">
                    {it.length}×{it.width}×{it.height}
                  </td>
                  <td className="p-2 capitalize">{it.status}</td>
                </tr>
              ))}
              {!items.length && (
                <tr>
                  <td className="p-2" colSpan={6}>
                    No items yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <form action={async () => setStatus(id, 'closing')} className="mt-4 inline-block">
        <Button type="submit" variant="outline">
          Mark closing
        </Button>
      </form>
      <form action={async () => setStatus(id, 'booked')} className="ml-2 inline-block">
        <Button type="submit" variant="outline">
          Mark booked
        </Button>
      </form>
      <form action={async () => setStatus(id, 'in_transit')} className="ml-2 inline-block">
        <Button type="submit" variant="outline">
          Mark in_transit
        </Button>
      </form>
      <form action={async () => setStatus(id, 'arrived')} className="ml-2 inline-block">
        <Button type="submit" variant="outline">
          Mark arrived
        </Button>
      </form>
    </main>
  );
}
