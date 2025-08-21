'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { z } from 'zod/v4';
import { authClient } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { IntentResponse, QuoteResponse } from '@containo/types';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

const IntentInput = z.object({
  userId: z.string().min(1),
  originPort: z.string().length(3),
  destPort: z.string().length(3),
  mode: z.enum(['sea', 'air']),
  cutoffAt: z.string(),
  weightKg: z.coerce.number().positive(),
  dimsCm: z.object({
    length: z.coerce.number().positive(),
    width: z.coerce.number().positive(),
    height: z.coerce.number().positive(),
  }),
});

const QuoteInput = z.object({
  originPort: z.string().length(3),
  destPort: z.string().length(3),
  mode: z.enum(['sea', 'air']),
  cutoffAt: z.string(),
  weightKg: z.coerce.number().positive(),
  dimsCm: z.object({
    length: z.coerce.number().positive(),
    width: z.coerce.number().positive(),
    height: z.coerce.number().positive(),
  }),
});

const usd = (n: number) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

const toLocalInputValue = (iso: string) => {
  const d = new Date(iso);
  const off = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - off).toISOString().slice(0, 16);
};
const toISOFromLocal = (local: string) => new Date(local).toISOString();

const AIR_VOL_DIVISOR = 6000;

export default function CheckoutPage() {
  const params = useSearchParams();
  const canceled = params.get('canceled') === '1';
  const { data: session } = authClient.useSession();

  const [form, setForm] = useState({
    userId: 'demo-user',
    originPort: 'AMS',
    destPort: 'BKK',
    mode: 'sea' as 'sea' | 'air',
    cutoffAt: new Date(Date.now() + 7 * 86400_000).toISOString(),
    weightKg: 120,
    length: 100,
    width: 80,
    height: 60,
  });

  const [idemKey, setIdemKey] = useState<string>(crypto.randomUUID());
  const [intent, setIntent] = useState<IntentResponse | null>(null);
  const [quote, setQuote] = useState<QuoteResponse | null>(null);

  const [log, setLog] = useState('');
  const [busy, setBusy] = useState(false);
  const [payBusy, setPayBusy] = useState(false);

  useEffect(() => {
    const uid = (session?.user as any)?.id as string | undefined;
    if (uid) setForm((f) => ({ ...f, userId: uid }));
  }, [session?.user]);

  useEffect(() => {
    const o = params.get('origin');
    const d = params.get('dest');
    const m = params.get('mode') as 'sea' | 'air' | null;
    const cutoff = params.get('cutoff');
    const w = params.get('w');
    const l = params.get('l');
    const wi = params.get('wi');
    const h = params.get('h');

    setForm((f) => ({
      ...f,
      originPort: o ? o.toUpperCase() : f.originPort,
      destPort: d ? d.toUpperCase() : f.destPort,
      mode: m === 'sea' || m === 'air' ? m : f.mode,
      cutoffAt: cutoff ?? f.cutoffAt,
      weightKg: w ? Number(w) : f.weightKg,
      length: l ? Number(l) : f.length,
      width: wi ? Number(wi) : f.width,
      height: h ? Number(h) : f.height,
    }));
  }, [params]);

  const body = useMemo(
    () => ({
      userId: form.userId,
      originPort: form.originPort.toUpperCase(),
      destPort: form.destPort.toUpperCase(),
      mode: form.mode,
      cutoffAt: form.cutoffAt,
      weightKg: Number(form.weightKg),
      dimsCm: {
        length: Number(form.length),
        width: Number(form.width),
        height: Number(form.height),
      },
    }),
    [form]
  );

  const volumeM3 = useMemo(
    () => (form.length * form.width * form.height) / 1_000_000,
    [form.length, form.width, form.height]
  );
  const chargeableAirKg = useMemo(() => {
    const volumetric = (form.length * form.width * form.height) / AIR_VOL_DIVISOR;
    return Math.max(form.weightKg, volumetric);
  }, [form.length, form.width, form.height, form.weightKg]);

  function swap() {
    setForm((f) => ({ ...f, originPort: f.destPort, destPort: f.originPort }));
  }

  async function onIntent() {
    setBusy(true);
    setLog(`Submitting intent… (Idempotency-Key: ${idemKey})`);
    setIntent(null);
    setQuote(null);
    try {
      const parsed = IntentInput.safeParse(body);
      if (!parsed.success) {
        setLog(parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('\n'));
        return;
      }

      const r = await fetch(`${API}/pools/intent`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'Idempotency-Key': idemKey },
        body: JSON.stringify(parsed.data),
        cache: 'no-store',
      });
      const j = await r.json();
      if (!r.ok) {
        setLog(`Intent failed: ${r.status} ${JSON.stringify(j)}`);
        return;
      }
      setIntent(j);
      setLog('Intent accepted.');

      const qIn = QuoteInput.parse({
        originPort: body.originPort,
        destPort: body.destPort,
        mode: body.mode,
        cutoffAt: body.cutoffAt,
        weightKg: body.weightKg,
        dimsCm: body.dimsCm,
      });

      const qr = await fetch(`${API}/pools/quote`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(qIn),
        cache: 'no-store',
      });
      const qj = await qr.json();

      if (!qr.ok) {
        setLog((s) => s + `\nQuote failed: ${qr.status} ${JSON.stringify(qj)}`);
        return;
      }
      setQuote(qj);
      setLog((s) => s + '\nQuote ready.');
    } catch (e: any) {
      setLog(String(e?.message ?? e));
    } finally {
      setBusy(false);
    }
  }

  async function onPay() {
    if (!intent) {
      setLog('Please reserve space first.');
      return;
    }
    const itemId = (intent as any).id;
    if (!itemId) {
      setLog('No item id returned by intent.');
      return;
    }
    const amountUsd =
      (quote as any)?.userPrice ?? (quote as any)?.priceUsd ?? (quote as any)?.totalUsd ?? 0;
    if (!amountUsd || amountUsd <= 0) {
      setLog('Missing or invalid amount. Get a quote first.');
      return;
    }

    setPayBusy(true);
    setLog('Creating Stripe Checkout session…');
    try {
      const resp = await fetch(`${API}/payments/checkout`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          itemId,
          amountUsd: Number(amountUsd),
          currency: 'USD',
          description: `Containo ${body.originPort} → ${body.destPort} (${body.mode})`,
        }),
      });
      const { url } = await resp.json();
      if (!resp.ok || !url) {
        setLog(`Create session failed: ${resp.status}`);
        return;
      }
      window.location.href = url;
    } catch (e: any) {
      setLog(String(e?.message ?? e));
    } finally {
      setPayBusy(false);
    }
  }

  const readyToPay = !!intent && !!quote;

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="mb-6 font-heading text-3xl font-bold tracking-tight">Checkout</h1>

      {canceled && (
        <Card className="mb-6 border-amber-200 bg-amber-50">
          <CardContent className="p-4 text-sm text-amber-900">
            Payment was canceled. No charge was made. You can adjust details and try again.
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-slate-200/70">
          <CardHeader>
            <CardTitle className="font-heading">Reserve space (idempotent)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="mb-1 block">User ID</Label>
              <Input
                value={form.userId}
                onChange={(e) => setForm((f) => ({ ...f, userId: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-3">
              <div>
                <Label className="mb-1 block">Origin (IATA)</Label>
                <Input
                  value={form.originPort}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, originPort: e.target.value.toUpperCase() }))
                  }
                />
              </div>
              <Button type="button" variant="outline" className="h-10 self-center" onClick={swap}>
                ↔
              </Button>
              <div>
                <Label className="mb-1 block">Destination (IATA)</Label>
                <Input
                  value={form.destPort}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, destPort: e.target.value.toUpperCase() }))
                  }
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label className="mb-1 block">Mode</Label>
                <select
                  className="w-full rounded-md border px-3 py-2"
                  value={form.mode}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, mode: e.target.value as 'sea' | 'air' }))
                  }
                >
                  <option value="sea">Sea</option>
                  <option value="air">Air</option>
                </select>
              </div>
              <div>
                <Label className="mb-1 block">Cut-off (local)</Label>
                <Input
                  type="datetime-local"
                  value={toLocalInputValue(form.cutoffAt)}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, cutoffAt: toISOFromLocal(e.target.value) }))
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-4 gap-3">
              <div>
                <Label className="mb-1 block">Weight (kg)</Label>
                <Input
                  type="number"
                  inputMode="decimal"
                  value={form.weightKg}
                  onChange={(e) => setForm((f) => ({ ...f, weightKg: Number(e.target.value) }))}
                />
              </div>
              <div>
                <Label className="mb-1 block">L (cm)</Label>
                <Input
                  type="number"
                  inputMode="numeric"
                  value={form.length}
                  onChange={(e) => setForm((f) => ({ ...f, length: Number(e.target.value) }))}
                />
              </div>
              <div>
                <Label className="mb-1 block">W (cm)</Label>
                <Input
                  type="number"
                  inputMode="numeric"
                  value={form.width}
                  onChange={(e) => setForm((f) => ({ ...f, width: Number(e.target.value) }))}
                />
              </div>
              <div>
                <Label className="mb-1 block">H (cm)</Label>
                <Input
                  type="number"
                  inputMode="numeric"
                  value={form.height}
                  onChange={(e) => setForm((f) => ({ ...f, height: Number(e.target.value) }))}
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <Preview label="Volume" value={`${volumeM3.toFixed(2)} m³`} />
              <Preview label="Chargeable (air)" value={`${chargeableAirKg.toFixed(1)} kg`} />
              <Preview
                label="Cut-off (UTC)"
                value={new Date(form.cutoffAt).toISOString().replace('T', ' ').slice(0, 16)}
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button onClick={onIntent} disabled={busy}>
                {busy ? 'Submitting…' : 'Reserve & fetch price'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIdemKey(crypto.randomUUID())}
              >
                Rotate Idempotency-Key
              </Button>
              <Input readOnly value={idemKey} className="ml-auto w-[320px]" />
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-slate-200/70">
            <CardHeader>
              <CardTitle className="font-heading">Intent</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-xs">{intent ? JSON.stringify(intent, null, 2) : '—'}</pre>
            </CardContent>
          </Card>

          <Card className="border-slate-200/70">
            <CardHeader>
              <CardTitle className="font-heading">Price</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {quote ? (
                <>
                  <div className="flex items-baseline justify-between">
                    <div>
                      <div className="text-sm text-slate-500">
                        {form.originPort} → {form.destPort} ({form.mode})
                      </div>
                      <div className="text-xs text-slate-500">
                        Cut-off: {new Date(form.cutoffAt).toLocaleString()}
                      </div>
                    </div>
                    <div className="font-heading text-3xl">
                      {usd((quote as any).userPrice ?? (quote as any).priceUsd ?? 0)}
                    </div>
                  </div>
                  <Button className="w-full" onClick={onPay} disabled={payBusy || !readyToPay}>
                    {payBusy ? 'Redirecting…' : 'Pay with card'}
                  </Button>
                </>
              ) : (
                <p className="text-sm text-slate-600">
                  Reserve space to fetch a price and pay securely.
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="border-slate-200/70">
            <CardHeader>
              <CardTitle className="font-heading">Log</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="whitespace-pre-wrap text-xs">{log || '—'}</pre>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}

function Preview({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-50 p-3 text-sm ring-1 ring-slate-900/10">
      <div className="text-slate-500">{label}</div>
      <div className="font-semibold text-slate-900">{value}</div>
    </div>
  );
}
