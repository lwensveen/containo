'use client';

import { useMemo, useState } from 'react';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { QuoteResponse } from '@containo/types';
import { quote } from '@/lib/api';

const QuoteInput = z.object({
  originPort: z.string().length(3),
  destPort: z.string().length(3),
  mode: z.enum(['sea', 'air']),
  cutoffISO: z.string(), // ISO string
  weightKg: z.coerce.number().positive(),
  dimsCm: z.object({
    length: z.coerce.number().positive(),
    width: z.coerce.number().positive(),
    height: z.coerce.number().positive(),
  }),
});

export default function QuotePage() {
  const [form, setForm] = useState({
    originPort: 'AMS',
    destPort: 'BKK',
    mode: 'sea',
    cutoffISO: new Date(Date.now() + 7 * 86400_000).toISOString(),
    weightKg: 3,
    length: 40,
    width: 30,
    height: 25,
  });

  const [result, setResult] = useState<QuoteResponse | null>(null);
  const [log, setLog] = useState('');

  const body = useMemo(
    () => ({
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

  async function onQuote() {
    const parsed = QuoteInput.safeParse(body);
    if (!parsed.success) {
      setLog(parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('\n'));
      return;
    }
    setLog('Quoting…');
    try {
      const q = await quote(parsed.data);
      setResult(q);
      setLog('OK');
    } catch (e: any) {
      setLog(String(e?.message ?? e));
    }
  }

  return (
    <main className="mx-auto max-w-5xl p-6">
      <h1 className="mb-4 text-2xl font-bold">Get a Quote</h1>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Shipment details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="origin">Origin (IATA)</Label>
                <Input
                  id="origin"
                  value={form.originPort}
                  onChange={(e) => setForm((f) => ({ ...f, originPort: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="dest">Destination (IATA)</Label>
                <Input
                  id="dest"
                  value={form.destPort}
                  onChange={(e) => setForm((f) => ({ ...f, destPort: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="mode">Mode</Label>
                <select
                  id="mode"
                  className="w-full rounded-md border px-3 py-2"
                  value={form.mode}
                  onChange={(e) => setForm((f) => ({ ...f, mode: e.target.value }))}
                >
                  <option value="sea">Sea</option>
                  <option value="air">Air</option>
                </select>
              </div>
              <div>
                <Label htmlFor="cutoff">Cutoff (ISO)</Label>
                <Input
                  id="cutoff"
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
                  onChange={(e) => {
                    setForm((f) => ({ ...f, weightKg: Number(e.target.value) }));
                  }}
                />
              </div>
              <div>
                <Label>L (cm)</Label>
                <Input
                  type="number"
                  value={form.length}
                  onChange={(e) => {
                    setForm((f) => ({ ...f, length: Number(e.target.value) }));
                  }}
                />
              </div>
              <div>
                <Label>W (cm)</Label>
                <Input
                  type="number"
                  value={form.width}
                  onChange={(e) => {
                    setForm((f) => ({ ...f, width: Number(e.target.value) }));
                  }}
                />
              </div>
              <div>
                <Label>H (cm)</Label>
                <Input
                  type="number"
                  value={form.height}
                  onChange={(e) => {
                    setForm((f) => ({ ...f, height: Number(e.target.value) }));
                  }}
                />
              </div>
            </div>

            <div className="flex gap-3">
              <Button onClick={onQuote}>Get quote</Button>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Quote response</CardTitle>
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
        </div>
      </div>
    </main>
  );
}
