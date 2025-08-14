'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

const SEA_RATE_PER_M3 = 35;
const AIR_RATE_PER_KG = 6;
const AIR_VOL_DIVISOR = 6000;
const clamp = (n: number) => (Number.isFinite(n) ? Math.max(0, n) : 0);
const usd = (n: number) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

export function Estimator() {
  const [mode, setMode] = useState<'sea' | 'air' | 'both'>('both');
  const [form, setForm] = useState({
    weightKg: 120,
    lengthCm: 100,
    widthCm: 80,
    heightCm: 60,
  });

  const volumeM3 = useMemo(() => {
    const v = (form.lengthCm * form.widthCm * form.heightCm) / 1_000_000;
    return clamp(v);
  }, [form]);

  const chargeableAirKg = useMemo(() => {
    const volumetricKg = (form.lengthCm * form.widthCm * form.heightCm) / AIR_VOL_DIVISOR;
    return clamp(Math.max(form.weightKg, volumetricKg));
  }, [form]);

  const seaPrice = clamp(SEA_RATE_PER_M3 * volumeM3);
  const airPrice = clamp(AIR_RATE_PER_KG * chargeableAirKg);

  return (
    <Card className="border-slate-200/70 bg-white shadow-sm ring-1 ring-slate-900/5">
      <CardHeader className="pb-3">
        <CardTitle className="font-heading text-xl">Quick estimator</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <div>
            <Label className="mb-1 block">Mode</Label>
            <RadioGroup
              value={mode}
              onValueChange={(v) => setMode(v as any)}
              className="flex gap-3"
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem id="m-both" value="both" />
                <Label htmlFor="m-both">Both</Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem id="m-sea" value="sea" />
                <Label htmlFor="m-sea">Sea</Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem id="m-air" value="air" />
                <Label htmlFor="m-air">Air</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="mb-1 block">L (cm)</Label>
              <Input
                type="number"
                value={form.lengthCm}
                onChange={(e) => setForm((f) => ({ ...f, lengthCm: Number(e.target.value) }))}
              />
            </div>
            <div>
              <Label className="mb-1 block">W (cm)</Label>
              <Input
                type="number"
                value={form.widthCm}
                onChange={(e) => setForm((f) => ({ ...f, widthCm: Number(e.target.value) }))}
              />
            </div>
            <div>
              <Label className="mb-1 block">H (cm)</Label>
              <Input
                type="number"
                value={form.heightCm}
                onChange={(e) => setForm((f) => ({ ...f, heightCm: Number(e.target.value) }))}
              />
            </div>
          </div>

          <div>
            <Label className="mb-1 block">Weight (kg)</Label>
            <Input
              type="number"
              value={form.weightKg}
              onChange={(e) => setForm((f) => ({ ...f, weightKg: Number(e.target.value) }))}
            />
          </div>

          <p className="text-xs text-slate-500">
            We’ll show a ballpark. Final price depends on route, cut-off, and options. Get your
            exact number on the next step.
          </p>
        </div>

        <div className="space-y-4">
          {(mode === 'sea' || mode === 'both') && (
            <div className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-900/10">
              <div className="flex items-baseline justify-between">
                <div>
                  <div className="font-heading text-lg">Sea estimate</div>
                  <div className="text-xs text-slate-500">
                    Volume {volumeM3.toFixed(2)} m³ × ${SEA_RATE_PER_M3}/m³
                  </div>
                </div>
                <div className="font-heading text-2xl">{usd(seaPrice)}</div>
              </div>
            </div>
          )}

          {(mode === 'air' || mode === 'both') && (
            <div className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-900/10">
              <div className="flex items-baseline justify-between">
                <div>
                  <div className="font-heading text-lg">Air estimate</div>
                  <div className="text-xs text-slate-500">
                    Chargeable {chargeableAirKg.toFixed(1)} kg × ${AIR_RATE_PER_KG}/kg
                  </div>
                </div>
                <div className="font-heading text-2xl">{usd(airPrice)}</div>
              </div>
              <div className="mt-2 text-xs text-slate-500">
                Air uses chargeable weight (max of actual vs volumetric; divisor {AIR_VOL_DIVISOR}).
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <Link href="/quote">
              <Button className="h-10 px-5">Get exact quote</Button>
            </Link>
            <Link href="/demo">
              <Button variant="outline" className="h-10 px-5">
                See the flow
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
