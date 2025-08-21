'use client';

import { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
const DEMO_USER = process.env.NEXT_PUBLIC_DEMO_USER_ID ?? '00000000-0000-0000-0000-000000000000';

type Pickup = {
  id: string;
  userId: string;
  contactName: string;
  address1: string;
  address2?: string | null;
  city: string;
  state?: string | null;
  postcode: string;
  country: string;
  windowStartAt: string;
  windowEndAt: string;
  pieces: number;
  totalWeightKg: number;
  notes?: string | null;
  status: 'requested' | 'scheduled' | 'picked_up' | 'canceled';
  carrierRef?: string | null;
  labelUrl?: string | null;
  createdAt: string;
};

const toLocal = (iso: string) => {
  const d = new Date(iso);
  const off = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - off).toISOString().slice(0, 16);
};
const toISO = (local: string) => new Date(local).toISOString();

export default function PickupsPage() {
  const [userId] = useState<string>(DEMO_USER);
  const [rows, setRows] = useState<Pickup[]>([]);
  const [loading, setLoading] = useState(true);
  const [log, setLog] = useState('');

  const [form, setForm] = useState({
    contactName: '',
    company: '',
    email: '',
    phone: '',
    address1: '',
    address2: '',
    city: '',
    state: '',
    postcode: '',
    country: 'NL',
    windowStart: toLocal(new Date().toISOString()),
    windowEnd: toLocal(new Date(Date.now() + 3 * 3600_000).toISOString()),
    pieces: 1,
    totalWeightKg: 10,
    notes: '',
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/pickups?userId=${encodeURIComponent(userId)}&limit=200`, {
        cache: 'no-store',
      });
      const j = await r.json();
      setRows(Array.isArray(j) ? j : []);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  async function submit() {
    setLog('Submitting…');
    try {
      const body = {
        userId,
        contactName: form.contactName,
        company: form.company || undefined,
        email: form.email || undefined,
        phone: form.phone || undefined,
        address1: form.address1,
        address2: form.address2 || undefined,
        city: form.city,
        state: form.state || undefined,
        postcode: form.postcode,
        country: form.country,
        windowStartAt: toISO(form.windowStart),
        windowEndAt: toISO(form.windowEnd),
        pieces: Number(form.pieces),
        totalWeightKg: Number(form.totalWeightKg),
        notes: form.notes || undefined,
      };
      const res = await fetch(`${API}/pickups`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(`Create failed: ${res.status} ${JSON.stringify(j)}`);
      setLog('Created');
      await load();
    } catch (e: any) {
      setLog(String(e?.message ?? e));
    }
  }

  useEffect(() => {
    load();
  }, [load]);

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="mb-6 font-heading text-3xl font-bold">Request pickup</h1>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Pickup details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label>Contact name</Label>
              <Input
                value={form.contactName}
                onChange={(e) => setForm({ ...form, contactName: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Company</Label>
                <Input
                  value={form.company}
                  onChange={(e) => setForm({ ...form, company: e.target.value })}
                />
              </div>
              <div>
                <Label>Phone</Label>
                <Input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label>Email</Label>
              <Input
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div>
              <Label>Address 1</Label>
              <Input
                value={form.address1}
                onChange={(e) => setForm({ ...form, address1: e.target.value })}
              />
            </div>
            <div>
              <Label>Address 2</Label>
              <Input
                value={form.address2}
                onChange={(e) => setForm({ ...form, address2: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>City</Label>
                <Input
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                />
              </div>
              <div>
                <Label>State</Label>
                <Input
                  value={form.state}
                  onChange={(e) => setForm({ ...form, state: e.target.value })}
                />
              </div>
              <div>
                <Label>Postcode</Label>
                <Input
                  value={form.postcode}
                  onChange={(e) => setForm({ ...form, postcode: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Country</Label>
                <Input
                  value={form.country}
                  onChange={(e) => setForm({ ...form, country: e.target.value.toUpperCase() })}
                />
              </div>
              <div>
                <Label>Window start</Label>
                <Input
                  type="datetime-local"
                  value={form.windowStart}
                  onChange={(e) => setForm({ ...form, windowStart: e.target.value })}
                />
              </div>
              <div>
                <Label>Window end</Label>
                <Input
                  type="datetime-local"
                  value={form.windowEnd}
                  onChange={(e) => setForm({ ...form, windowEnd: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Pieces</Label>
                <Input
                  type="number"
                  value={form.pieces}
                  onChange={(e) => setForm({ ...form, pieces: Number(e.target.value) })}
                />
              </div>
              <div className="col-span-2">
                <Label>Total weight (kg)</Label>
                <Input
                  type="number"
                  value={form.totalWeightKg}
                  onChange={(e) => setForm({ ...form, totalWeightKg: Number(e.target.value) })}
                />
              </div>
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </div>

            <div className="flex items-center gap-3">
              <Button onClick={submit}>Submit request</Button>
              <div className="text-sm text-slate-600">{log}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>My pickups</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {loading ? (
              <div className="text-sm text-slate-600">Loading…</div>
            ) : rows.length ? (
              rows.map((p) => (
                <div key={p.id} className="rounded border p-3 text-sm">
                  <div className="flex items-center justify-between">
                    <div className="font-mono">{p.id.slice(0, 8)}…</div>
                    <span className="capitalize">{p.status.replace(/_/g, ' ')}</span>
                  </div>
                  <div className="text-slate-600">
                    {p.address1}, {p.city} {p.postcode}, {p.country}
                  </div>
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
                </div>
              ))
            ) : (
              <div className="text-sm text-slate-600">No pickups yet.</div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
