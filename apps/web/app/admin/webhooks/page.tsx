'use client';

import { useEffect, useState } from 'react';
import { Container } from '@/components/layout/container';
import { Section } from '@/components/layout/section';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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

async function readJsonStrict(res: Response) {
  const text = await res.text();
  const ct = res.headers.get('content-type') || '';
  if (!ct.includes('application/json'))
    throw new Error(`expected JSON, got ${ct || '(none)'}: ${text.slice(0, 120)}`);
  return JSON.parse(text);
}

export default function WebhooksAdminPage() {
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');

  const [openNew, setOpenNew] = useState(false);
  const [newSub, setNewSub] = useState({ url: '', events: '*', secret: '' });
  const [busy, setBusy] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const data = await fetch(`${API}/webhooks`, { cache: 'no-store' }).then(readJsonStrict);
      setSubs(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setSubs([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = subs
    .filter((s) => {
      const needle = q.trim().toLowerCase();
      if (!needle) return true;
      return (
        s.id.toLowerCase().includes(needle) ||
        s.url.toLowerCase().includes(needle) ||
        (s.events || '').toLowerCase().includes(needle)
      );
    })
    .sort((a, b) => Number(b.isActive) - Number(a.isActive))
    .sort(
      (a, b) =>
        (b.createdAt ? Date.parse(b.createdAt) : 0) - (a.createdAt ? Date.parse(a.createdAt) : 0)
    );

  async function createSubscription() {
    setBusy(true);
    try {
      const res = await fetch(`${API}/webhooks`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(newSub),
      });
      if (!res.ok) throw new Error(`Create failed: ${res.status}`);
      setOpenNew(false);
      setNewSub({ url: '', events: '*', secret: '' });
      await load();
    } catch (e: any) {
      alert(e?.message ?? String(e));
    } finally {
      setBusy(false);
    }
  }

  async function deactivate(id: string) {
    if (!confirm('Deactivate this webhook subscription?')) return;
    try {
      const res = await fetch(`${API}/webhooks/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(`Deactivate failed: ${res.status}`);
      await load();
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
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="w-[280px]"
              />
              <Button variant="outline" onClick={load}>
                Refresh
              </Button>
              <Dialog open={openNew} onOpenChange={setOpenNew}>
                <DialogTrigger asChild>
                  <Button>New subscription</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create subscription</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3">
                    <div>
                      <div className="text-xs font-semibold text-slate-600">URL</div>
                      <Input
                        placeholder="https://example.com/webhooks"
                        value={newSub.url}
                        onChange={(e) => setNewSub((s) => ({ ...s, url: e.target.value }))}
                      />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-600">Events</div>
                      <Input
                        placeholder="* or comma-separated like pool_created,item_pooled"
                        value={newSub.events}
                        onChange={(e) => setNewSub((s) => ({ ...s, events: e.target.value }))}
                      />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-600">Secret</div>
                      <Input
                        placeholder="whsec_xxx..."
                        value={newSub.secret}
                        onChange={(e) => setNewSub((s) => ({ ...s, secret: e.target.value }))}
                      />
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                      <Button variant="outline" onClick={() => setOpenNew(false)}>
                        Cancel
                      </Button>
                      <Button onClick={createSubscription} disabled={busy}>
                        {busy ? 'Creating…' : 'Create'}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <Card className="border-slate-200/70">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="font-heading">Subscriptions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {loading ? (
                <div className="text-sm text-slate-600">Loading…</div>
              ) : filtered.length ? (
                filtered.map((s) => (
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
        </Container>
      </Section>
    </main>
  );
}
