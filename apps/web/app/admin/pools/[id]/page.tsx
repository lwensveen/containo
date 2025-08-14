import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { PoolItem } from '@containo/types';
import { Container } from '@/components/layout/container';
import { Section } from '@/components/layout/section';

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
    <main>
      <Section className="py-8">
        <Container className="max-w-6xl">
          <div className="mb-4 flex items-center justify-between">
            <h1 className="font-heading text-2xl font-bold">Pool {id.slice(0, 8)}…</h1>
            <div className="flex items-center gap-3">
              <a
                className="text-sm underline"
                href={`${API}/pools/${id}/items.csv`}
                target="_blank"
                rel="noreferrer"
              >
                Export CSV
              </a>
              <Link className="text-sm underline" href="/admin/pools">
                Back to pools
              </Link>
            </div>
          </div>

          <Card className="border-slate-200/70">
            <CardHeader>
              <CardTitle className="font-heading">Items</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="border-b bg-slate-50 text-left">
                  <tr>
                    <th className="px-3 py-2">Item</th>
                    <th className="px-3 py-2">User</th>
                    <th className="px-3 py-2">Weight (kg)</th>
                    <th className="px-3 py-2">Vol (m³)</th>
                    <th className="px-3 py-2">Dims (cm)</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it) => (
                    <tr key={it.id} className="border-b">
                      <td className="px-3 py-2 font-mono text-xs">{it.id.slice(0, 8)}…</td>
                      <td className="px-3 py-2">{it.userId ?? '-'}</td>
                      <td className="px-3 py-2">{it.weightKg}</td>
                      <td className="px-3 py-2">{Number(it.volumeM3).toFixed(2)}</td>
                      <td className="px-3 py-2">
                        {it.length}×{it.width}×{it.height}
                      </td>
                      <td className="px-3 py-2 capitalize">{it.status}</td>
                      <td className="px-3 py-2">
                        {it.createdAt
                          ? new Date(it.createdAt as any)
                              .toISOString()
                              .replace('T', ' ')
                              .slice(0, 16)
                          : '-'}
                      </td>
                    </tr>
                  ))}
                  {!items.length && (
                    <tr>
                      <td className="px-3 py-6 text-slate-500" colSpan={7}>
                        No items yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>

          <div className="mt-4 flex flex-wrap gap-2">
            <form action={async () => setStatus(id, 'closing')}>
              <Button type="submit" variant="outline" size="sm">
                Mark closing
              </Button>
            </form>
            <form action={async () => setStatus(id, 'booked')}>
              <Button type="submit" variant="outline" size="sm">
                Mark booked
              </Button>
            </form>
            <form action={async () => setStatus(id, 'in_transit')}>
              <Button type="submit" variant="outline" size="sm">
                Mark in_transit
              </Button>
            </form>
            <form action={async () => setStatus(id, 'arrived')}>
              <Button type="submit" variant="outline" size="sm">
                Mark arrived
              </Button>
            </form>
            <form
              action={async (formData) => {
                'use server';
                const bookingRef = String(formData.get('bookingRef') || '');
                await fetch(`${API}/consolidation/manual-book`, {
                  method: 'POST',
                  headers: { 'content-type': 'application/json' },
                  body: JSON.stringify({ poolId: id, bookingRef }),
                  cache: 'no-store',
                });
              }}
              className="mt-4 flex items-center gap-2"
            >
              <input
                name="bookingRef"
                placeholder="Booking reference"
                className="rounded border px-2 py-1"
              />
              <Button type="submit">Mark booked</Button>
            </form>
          </div>
        </Container>
      </Section>
    </main>
  );
}
