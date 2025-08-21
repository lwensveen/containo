'use client';

import { useMemo, useState } from 'react';
import { z } from 'zod/v4';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Container } from '@/components/layout/container';
import { Section } from '@/components/layout/section';
import { type LaneQuote, quote } from '@/lib/api';
import { ArrowRight, Plane, Ship } from 'lucide-react';

const QuoteFormSchema = z.object({
  originPort: z.string().trim().length(3, 'Use a 3-letter code'),
  destPort: z.string().trim().length(3, 'Use a 3-letter code'),
  mode: z.enum(['sea', 'air']),
  cutoffAt: z.string().min(1, 'Select a date & time'),
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

export default function QuoteMergedPage() {
  const [form, setForm] = useState<QuoteForm>({
    originPort: 'AMS',
    destPort: 'BKK',
    mode: 'sea',
    cutoffAt: new Date(Date.now() + 7 * 86400_000).toISOString(),
    weightKg: 120,
    length: 100,
    width: 80,
    height: 60,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<LaneQuote | null>(null);
  const [log, setLog] = useState('');
  const [compare, setCompare] = useState<{ sea?: LaneQuote; air?: LaneQuote } | null>(null);
  const [busyCompare, setBusyCompare] = useState(false);
  const [compareErr, setCompareErr] = useState<string | null>(null);

  const volumeM3 = useMemo(
    () => (form.length * form.width * form.height) / 1_000_000,
    [form.length, form.width, form.height]
  );

  const chargeableAirKg = useMemo(() => {
    const volumetric = (form.length * form.width * form.height) / AIR_VOL_DIVISOR;
    return Math.max(form.weightKg, volumetric);
  }, [form.length, form.width, form.height, form.weightKg]);

  async function onQuote() {
    setBusy(true);
    setErrors({});
    setResult(null);
    setLog('');

    const parsed = QuoteFormSchema.safeParse(form);
    if (!parsed.success) {
      const map: Record<string, string> = {};
      for (const i of parsed.error.issues) map[i.path.join('.')] = i.message;
      setErrors(map);
      setBusy(false);
      return;
    }

    try {
      setLog('Quoting…');
      const q = await quote({
        originPort: form.originPort,
        destPort: form.destPort,
        mode: form.mode,
        weightKg: form.weightKg,
        dimsL: form.length,
        dimsW: form.width,
        dimsH: form.height,
        pieces: 1,
      });
      setResult(q);
      setLog('OK');
    } catch (e: any) {
      setLog(String(e?.message ?? e));
    } finally {
      setBusy(false);
    }
  }
  const makeQuoteParams = (mode: 'sea' | 'air') => ({
    originPort: form.originPort,
    destPort: form.destPort,
    mode,
    weightKg: form.weightKg,
    dimsL: form.length,
    dimsW: form.width,
    dimsH: form.height,
    pieces: 1,
  });

  async function onCompare() {
    setCompareErr(null);
    setCompare(null);
    const parsed = QuoteFormSchema.safeParse(form);
    if (!parsed.success) {
      const map: Record<string, string> = {};
      for (const i of parsed.error.issues) map[i.path.join('.')] = i.message;
      setErrors(map);
      return;
    }

    setBusyCompare(true);
    try {
      const [sea, air] = await Promise.all([
        quote(makeQuoteParams('sea')).catch((e) => {
          console.warn('Sea quote failed', e);
          return undefined;
        }),
        quote(makeQuoteParams('air')).catch((e) => {
          console.warn('Air quote failed', e);
          return undefined;
        }),
      ]);
      if (!sea && !air) throw new Error('Both quotes failed');
      setCompare({ sea, air });
      document
        .getElementById('compare-card')
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (e: any) {
      setCompareErr(e?.message ?? 'Compare failed');
    } finally {
      setBusyCompare(false);
    }
  }

  function useOption(mode: 'sea' | 'air') {
    const opt = compare?.[mode];
    if (!opt) return;
    setForm((f) => ({ ...f, mode }));
    setResult(opt);
    document.getElementById('quote-card')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  const swap = () => setForm((f) => ({ ...f, originPort: f.destPort, destPort: f.originPort }));

  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-slate-50">
      <Section className="pt-20 pb-10 text-center">
        <Container>
          <Badge className="rounded-full bg-slate-900/5 px-3 py-1 text-slate-700 ring-1 ring-slate-900/10">
            Simple, transparent pricing
          </Badge>

          <h1 className="font-heading mx-auto mt-6 max-w-3xl text-balance text-5xl font-extrabold leading-tight tracking-tight text-slate-900 md:text-6xl">
            Pay only for the space you use
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-pretty text-lg leading-7 text-slate-600">
            Choose sea for best price or air for speed. Final price depends on size, weight, and
            route—get your exact quote below.
          </p>

          <div className="mt-8 flex items-center justify-center gap-3">
            <Link href="/contact">
              <Button size="lg" variant="outline" className="h-11 px-5">
                Talk to us
              </Button>
            </Link>
          </div>
        </Container>
      </Section>

      <Section className="pt-4 pb-10">
        <Container>
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

                  <Button
                    type="button"
                    variant="outline"
                    className="h-10 self-center"
                    onClick={swap}
                    aria-label="Swap origin and destination"
                  >
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
                    {errors.destPort && (
                      <p className="mt-1 text-xs text-red-600">{errors.destPort}</p>
                    )}
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
                      value={toLocalInputValue(form.cutoffAt)}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, cutoffAt: toISOFromLocal(e.target.value) }))
                      }
                    />
                    {errors.cutoffAt && (
                      <p className="mt-1 text-xs text-red-600">{errors.cutoffAt}</p>
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
                    {errors.weightKg && (
                      <p className="mt-1 text-xs text-red-600">{errors.weightKg}</p>
                    )}
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
                    value={new Date(form.cutoffAt).toISOString().replace('T', ' ').slice(0, 16)}
                  />
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <Button onClick={onQuote} disabled={busy}>
                    {busy ? 'Quoting…' : 'Get quote'}
                  </Button>

                  <Button
                    variant="secondary"
                    onClick={onCompare}
                    disabled={busy || busyCompare}
                    aria-label="Compare air vs sea"
                    title="Compare air vs sea"
                  >
                    {busyCompare ? 'Comparing…' : 'Compare air vs sea'}
                  </Button>

                  <Link
                    href={{
                      pathname: '/checkout',
                      query: {
                        origin: form.originPort,
                        dest: form.destPort,
                        mode: form.mode,
                        cutoff: form.cutoffAt,
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

              <Card id="compare-card" className="border-slate-200/70">
                <CardHeader>
                  <CardTitle className="font-heading">Compare air vs sea</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Button onClick={onCompare} disabled={busyCompare}>
                      {busyCompare ? 'Comparing…' : 'Compare'}
                    </Button>
                    {compareErr && <div className="text-xs text-rose-600">{compareErr}</div>}
                  </div>

                  {compare && (compare.sea || compare.air) ? (
                    <div className="grid gap-3 sm:grid-cols-2">
                      <CompareOption
                        label="Sea • best value"
                        mode="sea"
                        quote={compare.sea}
                        cheapest={isCheapest(compare, 'sea')}
                        onUse={() => useOption('sea')}
                      />
                      <CompareOption
                        label="Air • fastest"
                        mode="air"
                        quote={compare.air}
                        cheapest={isCheapest(compare, 'air')}
                        onUse={() => useOption('air')}
                      />
                    </div>
                  ) : (
                    <p className="text-sm text-slate-600">
                      Run a comparison to see both options side-by-side.
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
        </Container>
      </Section>

      <Section className="pt-4 pb-12">
        <Container>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <Card className="border-slate-200/70 bg-white shadow-sm ring-1 ring-slate-900/5">
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle className="font-heading text-xl">Sea — best value</CardTitle>
                <span className="rounded-lg bg-blue-500/10 p-2 text-blue-600">
                  <Ship className="h-5 w-5" />
                </span>
              </CardHeader>
              <CardContent className="space-y-4 text-slate-700">
                <div className="text-3xl font-semibold">
                  From <span className="font-heading">~$35</span> / m³
                </div>
                <ul className="list-outside list-disc space-y-1 pl-5 text-sm">
                  <li>Great for non-urgent shipments</li>
                  <li>Pools your cargo with compatible orders on the same lane</li>
                  <li>ETA depends on lane and cut-off; shown in your quote</li>
                </ul>
                <Button asChild className="mt-2">
                  <Link href="#top-form">Quote for sea</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="border-slate-200/70 bg-white shadow-sm ring-1 ring-slate-900/5">
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle className="font-heading text-xl">Air — fastest</CardTitle>
                <span className="rounded-lg bg-blue-500/10 p-2 text-blue-600">
                  <Plane className="h-5 w-5" />
                </span>
              </CardHeader>
              <CardContent className="space-y-4 text-slate-700">
                <div className="text-3xl font-semibold">
                  From <span className="font-heading">~$6</span> / kg
                </div>
                <ul className="list-outside list-disc space-y-1 pl-5 text-sm">
                  <li>Best when speed matters</li>
                  <li>Chargeable weight uses industry volumetric rules</li>
                  <li>Exact price & ETA shown in your quote</li>
                </ul>
                <Button asChild className="mt-2">
                  <Link href="#top-form">Quote for air</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </Container>
      </Section>

      <Section className="py-8">
        <Container>
          <Card className="border-slate-200/70 bg-gradient-to-br from-white to-slate-50 shadow-sm">
            <CardHeader>
              <CardTitle className="font-heading">What affects the price?</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[220px]">Factor</TableHead>
                    <TableHead>How it changes price</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">Route (lane)</TableCell>
                    <TableCell>
                      Some lanes are busier/longer than others; quote shows real-time lane pricing.
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Size & weight</TableCell>
                    <TableCell>
                      Sea focuses on volume (m³). Air uses chargeable weight (max of actual vs.
                      volumetric).
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Cut-off & timing</TableCell>
                    <TableCell>
                      Earlier cut-offs and faster departures may cost more but reduce transit time.
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Extras</TableCell>
                    <TableCell>
                      Optional pickup, insurance, or special handling are shown up-front before you
                      book.
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </Container>
      </Section>

      <Section className="pb-20 pt-2">
        <Container>
          <Card className="border-slate-200/70 bg-white shadow-sm ring-1 ring-slate-900/5">
            <CardHeader>
              <CardTitle className="font-heading">Pricing FAQs</CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="what-is-pooling">
                  <AccordionTrigger>What does “pooling” mean?</AccordionTrigger>
                  <AccordionContent>
                    We combine compatible shipments on the same route so everyone shares the
                    container space—and the cost. You only pay for the portion you use.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="how-is-air-charged">
                  <AccordionTrigger>How is air priced?</AccordionTrigger>
                  <AccordionContent>
                    Air uses chargeable weight: the higher of actual weight vs. volumetric weight
                    (based on dimensions). Your quote calculates this automatically.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="what-about-fees">
                  <AccordionTrigger>Are there extra fees?</AccordionTrigger>
                  <AccordionContent>
                    Optional services (pickup, insurance, special handling) are shown before you
                    book. No surprises—your quote is the price you pay.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="how-fast">
                  <AccordionTrigger>How fast can I ship?</AccordionTrigger>
                  <AccordionContent>
                    It depends on your lane and cut-off. Sea is the best value; air is fastest. Your
                    quote shows the expected departure and ETA.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="how-to-book">
                  <AccordionTrigger>How do I book?</AccordionTrigger>
                  <AccordionContent>
                    Get a price, hit “Reserve”, and you’re set. We’ll keep you updated from pickup
                    to delivery.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
              <div className="mt-6">
                <Button asChild>
                  <Link href="#top-form">
                    Get my exact price
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </Container>
      </Section>
    </main>
  );
}

function Preview({ label, value }: { label: string; value: string }) {
  return (
    <div id="top-form" className="rounded-lg bg-slate-50 p-3 text-sm ring-1 ring-slate-900/10">
      <div className="text-slate-500">{label}</div>
      <div className="font-semibold text-slate-900">{value}</div>
    </div>
  );
}

function QuoteResult({ result }: { result: LaneQuote }) {
  const { lane, price, weight, dims, rate } = result;
  const basisHint = price.basis === 'CBM' ? 'per m³' : 'per chargeable kg';

  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between">
        <div>
          <div className="font-heading text-lg">
            {lane.originPort} → {lane.destPort} ({lane.mode})
          </div>
          <div className="text-xs text-slate-500">
            {price.minimumApplied ? 'Minimum applied' : 'Usage-based'}
          </div>
        </div>
        <div className="font-heading text-3xl">{usd(price.total)}</div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Preview
          label={price.basis === 'CBM' ? 'Volume (m³)' : 'Chargeable (kg)'}
          value={price.basis === 'CBM' ? dims.volumeM3.toFixed(3) : weight.chargeableKg.toFixed(1)}
        />
        <Preview label={`Unit price (${basisHint})`} value={usd(price.unitPrice)} />
        <Preview label="Service fee" value={usd(price.serviceFee)} />
      </div>

      <div className="rounded-lg bg-white p-3 text-sm ring-1 ring-slate-900/10">
        <div className="mb-1 font-medium">Breakdown</div>
        <ul className="space-y-1">
          <li className="flex justify-between">
            <span className="text-slate-600">Subtotal</span>
            <span className="font-medium">{usd(price.subtotal)}</span>
          </li>
          <li className="flex justify-between">
            <span className="text-slate-600">Service fee</span>
            <span className="font-medium">{usd(price.serviceFee)}</span>
          </li>
          <li className="flex justify-between">
            <span className="text-slate-600">Total</span>
            <span className="font-medium">{usd(price.total)}</span>
          </li>
        </ul>
        <div className="mt-2 grid gap-2 text-xs text-slate-600 sm:grid-cols-2">
          <div>
            <div>Basis: {price.basis}</div>
            {rate.airMinPrice != null && lane.mode === 'air' && (
              <div>Min: {usd(rate.airMinPrice)}</div>
            )}
            {rate.seaMinPrice != null && lane.mode === 'sea' && (
              <div>Min: {usd(rate.seaMinPrice)}</div>
            )}
          </div>
          <div>
            <div>
              Dimensions: {dims.L_cm}×{dims.W_cm}×{dims.H_cm} cm
            </div>
            <div>
              Weight: actual {weight.actualKg.toFixed(1)} kg · volumetric{' '}
              {weight.volumetricKg.toFixed(1)} kg
            </div>
          </div>
        </div>
      </div>

      <Link
        href={{
          pathname: '/checkout',
          query: {
            origin: lane.originPort,
            dest: lane.destPort,
            mode: lane.mode,
            // add price.total
          },
        }}
      >
        <Button className="w-full">Reserve this price</Button>
      </Link>
    </div>
  );
}

function isCheapest(cmp: { sea?: LaneQuote; air?: LaneQuote }, mode: 'sea' | 'air'): boolean {
  const a = cmp.sea?.price.total ?? Infinity;
  const b = cmp.air?.price.total ?? Infinity;
  const target = mode === 'sea' ? a : b;
  const other = mode === 'sea' ? b : a;
  return target <= other;
}

function basisText(q: LaneQuote | undefined) {
  if (!q) return '—';
  return q.price.basis === 'CBM' ? 'per m³' : 'per chargeable kg';
}

function numberFmt(n?: number) {
  return typeof n === 'number' && isFinite(n) ? n : 0;
}

function CompareOption({
  label,
  mode,
  quote,
  cheapest,
  onUse,
}: {
  label: string;
  mode: 'sea' | 'air';
  quote?: LaneQuote;
  cheapest: boolean;
  onUse: () => void;
}) {
  return (
    <div className="rounded-lg border p-3">
      <div className="mb-1 flex items-center justify-between">
        <div className="text-sm font-medium text-slate-700">{label}</div>
        {cheapest && quote && (
          <span className="rounded bg-emerald-600 px-2 py-0.5 text-xs font-semibold text-white">
            Best value
          </span>
        )}
      </div>
      {quote ? (
        <>
          <div className="flex items-baseline justify-between">
            <div className="text-xs text-slate-500">{basisText(quote)}</div>
            <div className="font-heading text-2xl">{usd(numberFmt(quote.price.total))}</div>
          </div>
          <div className="mt-2 grid gap-2 text-xs text-slate-600 sm:grid-cols-2">
            <div>
              <div>Unit</div>
              <div className="font-medium">{usd(numberFmt(quote.price.unitPrice))}</div>
            </div>
            <div>
              <div>Service fee</div>
              <div className="font-medium">{usd(numberFmt(quote.price.serviceFee))}</div>
            </div>
            <div>
              <div>Dimensions</div>
              <div className="font-medium">
                {quote.dims.L_cm}×{quote.dims.W_cm}×{quote.dims.H_cm} cm
              </div>
            </div>
            <div>
              <div>Weight</div>
              <div className="font-medium">
                {quote.weight.actualKg.toFixed(1)} kg (chg {quote.weight.chargeableKg.toFixed(1)}{' '}
                kg)
              </div>
            </div>
          </div>
          <div className="mt-3">
            <Button onClick={onUse} className="w-full" variant={cheapest ? 'default' : 'outline'}>
              Use {mode}
            </Button>
          </div>
        </>
      ) : (
        <div className="text-sm text-slate-500">No quote available.</div>
      )}
    </div>
  );
}
