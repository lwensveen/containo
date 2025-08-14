'use client';

import { useMemo, useState } from 'react';
import { z } from 'zod/v4';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import type { QuoteResponse } from '@containo/types';
import { quote } from '@/lib/api';

const QuoteFormSchema = z.object({
  originPort: z.string().trim().length(3, 'Use a 3-letter code'),
  destPort: z.string().trim().length(3, 'Use a 3-letter code'),
  mode: z.enum(['sea', 'air']),
  cutoffISO: z.string().min(1, 'Select a date & time'),
  weightKg: z.coerce.number().positive('Enter a positive weight'),
  length: z.coerce.number().positive('Enter a positive number'),
  width: z.coerce.number().positive('Enter a positive number'),
  height: z.coerce.number().positive('Enter a positive number'),
});

type QuoteForm = z.infer<typeof QuoteFormSchema>;

const AIR_VOL_DIVISOR = 6000;
const usd = (n: number) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

const toLocalInputValue = (iso: string) => {
  const d = new Date(iso);
  const off = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - off).toISOString().slice(0, 16);
};
const toISOFromLocal = (local: string) => new Date(local).toISOString();

export default function QuotePage() {
  const [form, setForm] = useState<QuoteForm>({
    originPort: 'AMS',
    destPort: 'BKK',
    mode: 'sea',
    cutoffISO: new Date(Date.now() + 7 * 86400_000).toISOString(),
    weightKg: 120,
    length: 100,
    width: 80,
    height: 60,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<QuoteResponse | null>(null);
  const [log, setLog] = useState('');

  const volumeM3 = useMemo(
    () => (form.length * form.width * form.height) / 1_000_000,
    [form.length, form.width, form.height]
  );
  const chargeableAirKg = useMemo(() => {
    const volumetric = (form.length * form.width * form.height) / AIR_VOL_DIVISOR;
    return Math.max(form.weightKg, volumetric);
  }, [form.length, form.width, form.height, form.weightKg]);

  const body = useMemo(
    () => ({
      originPort: form.originPort.toUpperCase(),
      destPort: form.destPort.toUpperCase(),
      mode: form.mode,
      cutoffISO: form.cutoffISO,
      weightKg: Number(form.weightKg),
      dimsCm: {
        length: Number(form.length),
        width: Number(form.width),
        height: Number(form.height),
      },
    }),
    [form]
  );

  async function onQuote() {
    setBusy(true);
    setErrors({});
    setResult(null);
    setLog('');

    const parsed = QuoteFormSchema.safeParse(form);
    if (!parsed.success) {
      const map: Record<string, string> = {};
      for (const i of parsed.error.issues) {
        map[i.path.join('.')] = i.message;
      }
      setErrors(map);
      setBusy(false);
      return;
    }

    try {
      setLog('Quoting…');
      const q = await quote(body);
      setResult(q);
      setLog('OK');
    } catch (e: any) {
      setLog(String(e?.message ?? e));
    } finally {
      setBusy(false);
    }
  }

  const swap = () => setForm((f) => ({ ...f, originPort: f.destPort, destPort: f.originPort }));

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="font-heading mb-6 text-3xl font-bold tracking-tight">Get a quote</h1>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-slate-200/70">
          <CardHeader>
            <CardTitle className="font-heading">Shipment details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-3">
              <div className="space-y-2">
                <Label htmlFor="origin">Origin (IATA)</Label>
                <Input
                  id="origin"
                  value={form.originPort}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, originPort: e.target.value.toUpperCase() }))
                  }
                />
                {errors.originPort && (
                  <p className="mt-1 text-xs text-red-600">{errors.originPort}</p>
                )}
              </div>

              <Button type="button" variant="outline" className="h-10 self-center" onClick={swap}>
                ↔
              </Button>

              <div className="space-y-2">
                <Label htmlFor="dest">Destination (IATA)</Label>
                <Input
                  id="dest"
                  value={form.destPort}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, destPort: e.target.value.toUpperCase() }))
                  }
                />
                {errors.destPort && <p className="mt-1 text-xs text-red-600">{errors.destPort}</p>}
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <Label className="mb-1 block">Mode</Label>
                <RadioGroup
                  value={form.mode}
                  onValueChange={(v) => setForm((f) => ({ ...f, mode: v as 'sea' | 'air' }))}
                  className="flex gap-4"
                >
                  <label className="flex items-center gap-2">
                    <RadioGroupItem id="m-sea" value="sea" />
                    <span>Sea</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <RadioGroupItem id="m-air" value="air" />
                    <span>Air</span>
                  </label>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cutoff">Cut-off (local)</Label>
                <Input
                  id="cutoff"
                  type="datetime-local"
                  value={toLocalInputValue(form.cutoffISO)}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, cutoffISO: toISOFromLocal(e.target.value) }))
                  }
                />
                {errors.cutoffISO && (
                  <p className="mt-1 text-xs text-red-600">{errors.cutoffISO}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label>Weight (kg)</Label>
                <Input
                  type="number"
                  inputMode="decimal"
                  value={form.weightKg}
                  onChange={(e) => setForm((f) => ({ ...f, weightKg: Number(e.target.value) }))}
                />
                {errors.weightKg && <p className="mt-1 text-xs text-red-600">{errors.weightKg}</p>}
              </div>
              <div className="space-y-2">
                <Label>L (cm)</Label>
                <Input
                  type="number"
                  inputMode="numeric"
                  value={form.length}
                  onChange={(e) => setForm((f) => ({ ...f, length: Number(e.target.value) }))}
                />
                {errors.length && <p className="mt-1 text-xs text-red-600">{errors.length}</p>}
              </div>
              <div className="space-y-2">
                <Label>W (cm)</Label>
                <Input
                  type="number"
                  inputMode="numeric"
                  value={form.width}
                  onChange={(e) => setForm((f) => ({ ...f, width: Number(e.target.value) }))}
                />
                {errors.width && <p className="mt-1 text-xs text-red-600">{errors.width}</p>}
              </div>
              <div className="space-y-2">
                <Label>H (cm)</Label>
                <Input
                  type="number"
                  inputMode="numeric"
                  value={form.height}
                  onChange={(e) => setForm((f) => ({ ...f, height: Number(e.target.value) }))}
                />
                {errors.height && <p className="mt-1 text-xs text-red-600">{errors.height}</p>}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <Preview label="Volume" value={`${volumeM3.toFixed(2)} m³`} />
              <Preview label="Chargeable (air)" value={`${chargeableAirKg.toFixed(1)} kg`} />
              <Preview
                label="Cut-off (UTC)"
                value={new Date(form.cutoffISO).toISOString().replace('T', ' ').slice(0, 16)}
              />
            </div>

            <div className="flex gap-3">
              <Button onClick={onQuote} disabled={busy}>
                {busy ? 'Quoting…' : 'Get quote'}
              </Button>
              <Link
                href={{
                  pathname: '/checkout',
                  query: {
                    origin: form.originPort,
                    dest: form.destPort,
                    mode: form.mode,
                    cutoff: form.cutoffISO,
                    w: String(form.weightKg),
                    l: String(form.length),
                    wi: String(form.width),
                    h: String(form.height),
                  },
                }}
              >
                <Button variant="outline">Reserve space</Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-slate-200/70">
            <CardHeader>
              <CardTitle className="font-heading">Quote</CardTitle>
            </CardHeader>
            <CardContent>
              {result ? (
                <QuoteResult result={result} />
              ) : (
                <p className="text-sm text-slate-600">
                  Fill in details and click <b>Get quote</b>.
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

function QuoteResult({ result }: { result: QuoteResponse }) {
  const total = (result as any).priceUsd ?? (result as any).totalUsd ?? 0;
  const eta = (result as any).etaDays ?? (result as any).eta_days ?? (result as any).eta ?? null;

  const breakdown = (result as any).breakdown ?? null;

  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between">
        <div>
          <div className="font-heading text-lg">Total</div>
          <div className="text-xs text-slate-500">Exact at booking; no hidden fees</div>
        </div>
        <div className="font-heading text-3xl">{usd(Number(total) || 0)}</div>
      </div>

      {eta !== null && (
        <div className="rounded-lg bg-slate-50 p-3 text-sm ring-1 ring-slate-900/10">
          <div className="text-slate-500">Estimated transit</div>
          <div className="font-semibold text-slate-900">
            {typeof eta === 'number' ? `${eta} days` : String(eta)}
          </div>
        </div>
      )}

      {breakdown && (
        <div className="rounded-lg bg-white p-3 text-sm ring-1 ring-slate-900/10">
          <div className="mb-1 font-medium">Breakdown</div>
          <ul className="space-y-1">
            {Object.entries(breakdown).map(([k, v]) => (
              <li key={k} className="flex justify-between">
                <span className="capitalize text-slate-600">{k.replace(/_/g, ' ')}</span>
                <span className="font-medium">{usd(Number(v) || 0)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <Link href="/checkout">
        <Button className="w-full">Reserve this price</Button>
      </Link>
    </div>
  );
}
