'use client';

import { useMemo, useState } from 'react';
import { z } from 'zod/v4';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { IntentResponse } from '@containo/types';

const IntentInput = z.object({
  userId: z.string().min(1),
  originPort: z.string().length(3),
  destPort: z.string().length(3),
  mode: z.enum(['sea', 'air']),
  cutoffISO: z.string(),
  weightKg: z.coerce.number().positive(),
  dimsCm: z.object({
    length: z.coerce.number().positive(),
    width: z.coerce.number().positive(),
    height: z.coerce.number().positive(),
  }),
});

export default function CheckoutPage() {
  const [form, setForm] = useState({
    userId: 'demo-user',
    originPort: 'AMS',
    destPort: 'BKK',
    mode: 'sea',
    cutoffISO: new Date(Date.now() + 7 * 86400_000).toISOString(),
    weightKg: 3,
    length: 40,
    width: 30,
    height: 25,
  });
  const [idemKey, setIdemKey] = useState<string>(crypto.randomUUID());
  const [result, setResult] = useState<IntentResponse | null>(null);
  const [log, setLog] = useState('');

  const body = useMemo(
    () => ({
      userId: form.userId,
      originPort: form.originPort.toUpperCase(),
      destPort: form.destPort.toUpperCase(),
      mode: form.mode as 'sea' | 'air',
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

  async function onIntent() {
    const parsed = IntentInput.safeParse(body);
    if (!parsed.success) {
      setLog(parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('\n'));
      return;
    }
    setLog(`Submitting… (Idempotency-Key: ${idemKey})`);
    try {
      const r = await fetch(
        (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000') + '/pools/intent',
        {
          method: 'POST',
          headers: { 'content-type': 'application/json', 'Idempotency-Key': idemKey },
          body: JSON.stringify(parsed.data),
          cache: 'no-store',
        }
      );
      const j = await r.json();
      if (!r.ok) {
        setLog(`Intent failed: ${r.status} ${JSON.stringify(j)}`);
        return;
      }
      setResult(j);
      setLog('OK');
    } catch (e: any) {
      setLog(String(e?.message ?? e));
    }
  }

  return (
    <main className="mx-auto max-w-5xl p-6">
      <h1 className="mb-4 text-2xl font-bold">Checkout / Intent</h1>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Reserve space</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Label className="block">User ID</Label>
            <Input
              value={form.userId}
              onChange={(e) => setForm((f) => ({ ...f, userId: e.target.value }))}
            />

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Origin (IATA)</Label>
                <Input
                  value={form.originPort}
                  onChange={(e) => setForm((f) => ({ ...f, originPort: e.target.value }))}
                />
              </div>
              <div>
                <Label>Destination (IATA)</Label>
                <Input
                  value={form.destPort}
                  onChange={(e) => setForm((f) => ({ ...f, destPort: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Mode</Label>
                <select
                  className="w-full rounded-md border px-3 py-2"
                  value={form.mode}
                  onChange={(e) => setForm((f) => ({ ...f, mode: e.target.value }))}
                >
                  <option value="sea">Sea</option>
                  <option value="air">Air</option>
                </select>
              </div>
              <div>
                <Label>Cutoff (ISO)</Label>
                <Input
                  value={form.cutoffISO}
                  onChange={(e) => setForm((f) => ({ ...f, cutoffISO: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Weight (kg)</Label>
                <Input
                  type="number"
                  value={form.weightKg}
                  onChange={(e) => setForm((f) => ({ ...f, weightKg: Number(e.target.value) }))}
                />
              </div>
              <div>
                <Label>L (cm)</Label>
                <Input
                  type="number"
                  value={form.length}
                  onChange={(e) => setForm((f) => ({ ...f, length: Number(e.target.value) }))}
                />
              </div>
              <div>
                <Label>W (cm)</Label>
                <Input
                  type="number"
                  value={form.width}
                  onChange={(e) => setForm((f) => ({ ...f, width: Number(e.target.value) }))}
                />
              </div>
              <div>
                <Label>H (cm)</Label>
                <Input
                  type="number"
                  value={form.height}
                  onChange={(e) => setForm((f) => ({ ...f, height: Number(e.target.value) }))}
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button onClick={onIntent}>Submit intent</Button>
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
          <Card>
            <CardHeader>
              <CardTitle>Intent response</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-xs">{result ? JSON.stringify(result, null, 2) : '—'}</pre>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Log</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-xs whitespace-pre-wrap">{log || '—'}</pre>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Tip</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-600">
              Re-submit with the <code>same</code> Idempotency-Key; you should get the same{' '}
              <code>id</code> and no duplicate capacity usage.
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
