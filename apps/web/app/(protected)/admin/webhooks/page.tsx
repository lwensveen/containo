'use client';

import { useEffect, useMemo, useState } from 'react';
import { Container } from '@/components/layout/container';
import { Section } from '@/components/layout/section';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

type Subscription = {
  id: string;
  url: string;
  events: string;
  secret?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
};

type Delivery = {
  id: string;
  subscriptionId: string;
  eventId: string;
  eventType: string;
  payload: unknown;
  attemptCount: number;
  nextAttemptAt: string | null;
  lastError?: string | null;
  responseStatus?: number | null;
  status: 'pending' | 'delivered' | 'failed';
  createdAt?: string;
  updatedAt?: string;
};

function classNames(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(' ');
}

async function readJsonStrict(res: Response) {
  const text = await res.text();
  const ct = res.headers.get('content-type') || '';
  if (!ct.includes('application/json'))
    throw new Error(`expected JSON, got ${ct || '(none)'}: ${text.slice(0, 120)}`);
  return JSON.parse(text);
}

function getSessionIdFromPayload(payload: unknown): string | null {
  try {
    if (payload && typeof payload === 'object') {
      const p: any = payload;
      return p.sessionId || p.stripe_session_id || null;
    }
  } catch {}
  return null;
}

async function refund(sessionId: string) {
  const key = localStorage.getItem('x-admin-token') || prompt('Enter admin token') || '';
  if (!key) return alert('Admin token required');

  const res = await fetch(`${API}/payments/refunds`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-admin-token': key,
    },
    body: JSON.stringify({ sessionId }),
  });
  if (!res.ok) {
    const t = await res.text();
    return alert(`Refund failed: ${res.status} ${t}`);
  }
  alert('Refund requested');
}

async function refundByDelivery(d: Delivery) {
  const sessionId = getSessionIdFromPayload(d.payload);
  if (!sessionId) {
    const manual = prompt('No sessionId in payload. Enter Stripe session id to refund:');
    if (!manual) return;
    await refund(manual);
    return;
  }
  await refund(sessionId);
}

function CreateSubscriptionDialog({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState('');
  const [events, setEvents] = useState('status_changed,fill_80,fill_90,fill_100,customs_ready');
  const [secret, setSecret] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit() {
    setBusy(true);
    setErr(null);
    try {
      const body = {
        url: url.trim(),
        events: events
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
          .join(','),
        secret: secret.trim() || undefined,
      };

      const resp = await fetch(`${API}/webhooks`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await resp.json().catch(() => ({}));
      if (!resp.ok) throw new Error(json?.message || `HTTP ${resp.status}`);

      setOpen(false);
      setUrl('');
      setEvents('status_changed,customs_ready');
      setSecret('');
      onCreated();
    } catch (e: any) {
      setErr(String(e?.message ?? e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>New subscription</Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create subscription</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label htmlFor="sub-url">Destination URL</Label>
            <Input
              id="sub-url"
              placeholder="https://example.com/webhooks/containo"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="sub-events">Events (comma-separated)</Label>
            <Input
              id="sub-events"
              placeholder="status_changed,customs_ready"
              value={events}
              onChange={(e) => setEvents(e.target.value)}
            />
            <p className="mt-1 text-xs text-slate-500">
              e.g. <code>status_changed,fill_80,fill_90,fill_100,customs_ready</code>
            </p>
          </div>
          <div>
            <Label htmlFor="sub-secret">Signing secret (optional)</Label>
            <Input
              id="sub-secret"
              placeholder="whsec_***"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
            />
            <p className="mt-1 text-xs text-slate-500">
              We sign with HMAC-SHA256 in the <code>x-containo-signature</code> header.
            </p>
          </div>

          {err && <div className="text-xs text-rose-600">{err}</div>}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={busy}>
              Cancel
            </Button>
            <Button onClick={submit} disabled={busy || !url.trim()}>
              {busy ? 'Creating…' : 'Create'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function DeliveryDialog({ delivery }: { delivery: Delivery }) {
  const pretty = (v: unknown) => {
    try {
      return JSON.stringify(v, null, 2);
    } catch {
      return String(v);
    }
  };
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          View
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Delivery {delivery.id.slice(0, 8)}…</DialogTitle>
        </DialogHeader>
        <div className="space-y-2 text-sm">
          <div className="grid grid-cols-2 gap-2">
            <Field label="Event type" value={delivery.eventType} />
            <Field label="Event id" value={delivery.eventId} mono />
            <Field label="Subscription" value={delivery.subscriptionId} mono />
            <Field label="Status" value={delivery.status} />
            <Field label="HTTP status" value={String(delivery.responseStatus ?? '—')} />
            <Field label="Attempts" value={String(delivery.attemptCount)} />
            <Field
              label="Next attempt"
              value={
                delivery.nextAttemptAt ? new Date(delivery.nextAttemptAt).toLocaleString() : '—'
              }
            />
          </div>
          <Separator />
          <div>
            <div className="mb-1 text-xs font-semibold text-slate-500">Payload</div>
            <pre className="max-h-72 overflow-auto rounded-md bg-slate-50 p-3 text-xs">
              {pretty(delivery.payload)}
            </pre>
          </div>
          {delivery.lastError && (
            <>
              <Separator />
              <div>
                <div className="mb-1 text-xs font-semibold text-rose-600">Last error</div>
                <pre className="max-h-48 overflow-auto rounded-md bg-rose-50 p-3 text-xs text-rose-700">
                  {delivery.lastError}
                </pre>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div className="text-[11px] font-semibold text-slate-500">{label}</div>
      <div className={classNames('truncate', mono && 'font-mono')}>{value}</div>
    </div>
  );
}

export default function WebhooksAdminPage() {
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [loadingSubs, setLoadingSubs] = useState(true);
  const [qSubs, setQSubs] = useState('');
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loadingDel, setLoadingDel] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'delivered' | 'failed'>('all');
  const [qDel, setQDel] = useState('');

  async function loadSubs() {
    setLoadingSubs(true);
    try {
      const data = await fetch(`${API}/webhooks`, { cache: 'no-store' }).then(readJsonStrict);
      setSubs(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setSubs([]);
    } finally {
      setLoadingSubs(false);
    }
  }

  async function loadDeliveries() {
    setLoadingDel(true);
    try {
      const qs = filter === 'all' ? '' : `?status=${encodeURIComponent(filter)}`;
      const data = await fetch(`${API}/webhooks/deliveries${qs}`, { cache: 'no-store' }).then(
        readJsonStrict
      );
      setDeliveries(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setDeliveries([]);
    } finally {
      setLoadingDel(false);
    }
  }

  useEffect(() => {
    loadSubs();
  }, []);

  useEffect(() => {
    loadDeliveries();
  }, [filter, loadDeliveries]);

  const filteredSubs = useMemo(() => {
    const needle = qSubs.trim().toLowerCase();
    return subs
      .filter((s) =>
        !needle
          ? true
          : s.id.toLowerCase().includes(needle) ||
            s.url.toLowerCase().includes(needle) ||
            (s.events || '').toLowerCase().includes(needle)
      )
      .sort((a, b) => Number(b.isActive) - Number(a.isActive))
      .sort(
        (a, b) =>
          (b.createdAt ? Date.parse(b.createdAt) : 0) - (a.createdAt ? Date.parse(a.createdAt) : 0)
      );
  }, [subs, qSubs]);

  const filteredDeliveries = useMemo(() => {
    const needle = qDel.trim().toLowerCase();
    const arr = deliveries
      .filter((d) => (filter === 'all' ? true : d.status === filter))
      .sort(
        (a, b) =>
          (b.createdAt ? Date.parse(b.createdAt) : 0) - (a.createdAt ? Date.parse(a.createdAt) : 0)
      );
    if (!needle) return arr;
    return arr.filter((d) =>
      [d.id, d.eventId, d.eventType, d.subscriptionId, String(d.responseStatus ?? ''), d.status]
        .join(' ')
        .toLowerCase()
        .includes(needle)
    );
  }, [deliveries, filter, qDel]);

  async function deactivate(id: string) {
    if (!confirm('Deactivate this webhook subscription?')) return;
    try {
      const res = await fetch(`${API}/webhooks/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(`Deactivate failed: ${res.status}`);
      await loadSubs();
    } catch (e: any) {
      alert(e?.message ?? String(e));
    }
  }

  return (
    <main>
      <Section className="py-8">
        <Container className="max-w-6xl">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h1 className="font-heading text-2xl font-bold">Webhooks</h1>
            <div className="flex flex-wrap items-center gap-2">
              <Input
                placeholder="Search id / url / events"
                value={qSubs}
                onChange={(e) => setQSubs(e.target.value)}
                className="w-[280px]"
              />
              <Button variant="outline" onClick={loadSubs}>
                Refresh
              </Button>
              <CreateSubscriptionDialog onCreated={loadSubs} />
            </div>
          </div>

          <Card className="border-slate-200/70">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="font-heading">Subscriptions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {loadingSubs ? (
                <div className="text-sm text-slate-600">Loading…</div>
              ) : filteredSubs.length ? (
                filteredSubs.map((s) => (
                  <div key={s.id} className="rounded-lg border p-3">
                    <div className="flex items-center justify-between">
                      <div className="font-mono text-xs">{s.id.slice(0, 8)}…</div>
                      <Badge className={s.isActive ? 'bg-emerald-600' : 'bg-slate-500'}>
                        {s.isActive ? 'active' : 'inactive'}
                      </Badge>
                    </div>
                    <Separator className="my-2" />
                    <div className="break-all text-xs text-slate-600">
                      <div>
                        <span className="font-semibold">URL:</span> {s.url}
                      </div>
                      <div>
                        <span className="font-semibold">Events:</span> {s.events}
                      </div>
                    </div>
                    <div className="mt-2 flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => deactivate(s.id)}
                        disabled={!s.isActive}
                      >
                        Deactivate
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-sm text-slate-600">No subscriptions.</div>
              )}

              <div className="text-xs text-slate-500">
                Tip: seed a local echo subscriber – POST to your API with:
                <code className="mx-1 rounded bg-slate-100 px-1.5 py-0.5">url</code>=
                <code className="rounded bg-slate-100 px-1.5 py-0.5">
                  http://localhost:3000/api/webhook-echo
                </code>
                ,<code className="ml-1 rounded bg-slate-100 px-1.5 py-0.5">secret</code>=
                <code className="rounded bg-slate-100 px-1.5 py-0.5">whsec_demo_123</code>.
              </div>
            </CardContent>
          </Card>

          <div className="mt-10 mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-heading text-xl font-semibold">Deliveries</h2>
            <div className="flex flex-wrap items-center gap-2">
              <select
                className="h-9 rounded-md border px-3"
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
              >
                <option value="all">All</option>
                <option value="pending">Pending</option>
                <option value="delivered">Delivered</option>
                <option value="failed">Failed</option>
              </select>
              <Input
                placeholder="Search id / event / status"
                value={qDel}
                onChange={(e) => setQDel(e.target.value)}
                className="w-[280px]"
              />
              <Button variant="outline" onClick={loadDeliveries}>
                Refresh
              </Button>
            </div>
          </div>

          <Card className="border-slate-200/70">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="font-heading">Deliveries</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="border-b bg-slate-50">
                  <tr className="[&>th]:p-2 text-left">
                    <th>ID</th>
                    <th>Event</th>
                    <th>Sub</th>
                    <th>Status</th>
                    <th>HTTP</th>
                    <th>Attempts</th>
                    <th>Next Attempt</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingDel ? (
                    <tr>
                      <td className="p-2" colSpan={8}>
                        Loading…
                      </td>
                    </tr>
                  ) : filteredDeliveries.length ? (
                    filteredDeliveries.map((d) => (
                      <tr key={d.id} className="border-b align-top">
                        <td className="p-2 font-mono">{d.id.slice(0, 8)}…</td>
                        <td className="p-2">
                          <div className="font-mono">{d.eventType}</div>
                          <div className="text-xs text-slate-500">
                            evt: {d.eventId.slice(0, 8)}…
                          </div>
                        </td>
                        <td className="p-2 font-mono">{d.subscriptionId.slice(0, 8)}…</td>
                        <td className="p-2">
                          <Badge
                            className={classNames(
                              d.status === 'delivered' && 'bg-emerald-600',
                              d.status === 'failed' && 'bg-rose-600',
                              d.status === 'pending' && 'bg-amber-600'
                            )}
                          >
                            {d.status}
                          </Badge>
                        </td>
                        <td className="p-2">{d.responseStatus ?? '—'}</td>
                        <td className="p-2">{d.attemptCount}</td>
                        <td className="p-2">
                          {d.nextAttemptAt ? new Date(d.nextAttemptAt).toLocaleString() : '—'}
                        </td>
                        <td className="p-2 space-x-2">
                          <DeliveryDialog delivery={d} />
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => refundByDelivery(d)}
                            title="Refund this payment (requires admin token)"
                          >
                            Refund
                          </Button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td className="p-2" colSpan={8}>
                        No deliveries.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </Container>
      </Section>
    </main>
  );
}
