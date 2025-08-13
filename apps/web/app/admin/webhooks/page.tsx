'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

type Subscription = {
  id: string;
  url: string;
  events: string;
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
  nextAttemptAt: string;
  lastError?: string | null;
  responseStatus?: number | null;
  status: 'pending' | 'delivered' | 'failed';
  createdAt?: string;
  updatedAt?: string;
};

function classNames(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(' ');
}

export default function WebhooksAdminPage() {
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'delivered' | 'failed'>('all');
  const [q, setQ] = useState('');

  async function readJsonStrict(res: Response) {
    const text = await res.text();
    const ct = res.headers.get('content-type') || '';
    if (!ct.includes('application/json'))
      throw new Error(`expected JSON, got ${ct || '(none)'}: ${text.slice(0, 120)}`);
    return JSON.parse(text);
  }

  async function load() {
    setLoading(true);
    try {
      const [s, d] = await Promise.all([
        fetch(`${API}/webhooks/subscriptions`, { cache: 'no-store' }).then(readJsonStrict),
        fetch(`${API}/webhooks/deliveries`, { cache: 'no-store' }).then(readJsonStrict),
      ]);
      setSubs(Array.isArray(s) ? s : []);
      setDeliveries(Array.isArray(d) ? d : []);
    } catch (e) {
      console.error(e);
      setSubs([]);
      setDeliveries([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    return deliveries
      .filter((d) => (filter === 'all' ? true : d.status === filter))
      .filter((d) => {
        if (!q.trim()) return true;
        const needle = q.trim().toLowerCase();
        return (
          d.id.toLowerCase().includes(needle) ||
          d.eventId.toLowerCase().includes(needle) ||
          d.eventType.toLowerCase().includes(needle) ||
          String(d.responseStatus ?? '').includes(needle)
        );
      })
      .sort(
        (a, b) =>
          (b.createdAt ? Date.parse(b.createdAt) : 0) - (a.createdAt ? Date.parse(a.createdAt) : 0)
      );
  }, [deliveries, filter, q]);

  return (
    <main className="mx-auto max-w-6xl p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Webhooks</h1>
        <div className="flex items-center gap-2">
          <Input
            placeholder="Search id / event / status"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-[280px]"
          />
          <Button variant="outline" onClick={load}>
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Deliveries</CardTitle>
            <Tabs value={filter} onValueChange={(v) => setFilter(v as any)}>
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="pending">Pending</TabsTrigger>
                <TabsTrigger value="delivered">Delivered</TabsTrigger>
                <TabsTrigger value="failed">Failed</TabsTrigger>
              </TabsList>
            </Tabs>
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
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td className="p-2" colSpan={8}>
                      Loading…
                    </td>
                  </tr>
                ) : filtered.length ? (
                  filtered.map((d) => (
                    <tr key={d.id} className="border-b align-top">
                      <td className="p-2 font-mono">{d.id.slice(0, 8)}…</td>
                      <td className="p-2">
                        <div className="font-mono">{d.eventType}</div>
                        <div className="text-xs text-slate-500">evt: {d.eventId.slice(0, 8)}…</div>
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
                      <td className="p-2">
                        <DeliveryDialog delivery={d} />
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

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Subscriptions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {subs.length ? (
              subs.map((s) => (
                <div key={s.id} className="rounded-lg border p-3">
                  <div className="flex items-center justify-between">
                    <div className="font-mono text-xs">{s.id.slice(0, 8)}…</div>
                    <Badge className={s.isActive ? 'bg-emerald-600' : 'bg-slate-500'}>
                      {s.isActive ? 'active' : 'inactive'}
                    </Badge>
                  </div>
                  <Separator className="my-2" />
                  <div className="text-xs text-slate-600 break-all">
                    <div>
                      <span className="font-semibold">URL:</span> {s.url}
                    </div>
                    <div>
                      <span className="font-semibold">Events:</span> {s.events}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-sm text-slate-600">No subscriptions.</div>
            )}

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="text-xs text-slate-500 underline cursor-help">
                    Tip: seed an echo subscriber for local testing
                  </div>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  POST a subscription to your API with url ={' '}
                  <code>http://localhost:3000/api/webhook-echo</code> and secret{' '}
                  <code>whsec_demo_123</code>.
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardContent>
        </Card>
      </div>
    </main>
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
