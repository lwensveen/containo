import Link from 'next/link';
import { ArrowRight, Boxes, DollarSign, Shield, Truck, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-slate-50">
      <section className="mx-auto max-w-6xl px-6 pt-16 pb-10 text-center">
        <Badge className="rounded-full px-3 py-1">Global consolidation, simplified</Badge>

        <h1 className="font-heading mt-6 text-4xl font-bold tracking-tight md:text-6xl">
          Pool small shipments, pay less, ship faster
        </h1>

        <p className="mx-auto mt-4 max-w-2xl text-slate-600">
          Containo pools compatible shipments on popular lanes (e.g. AMS → BKK) so you pay for the
          space you use. Quote in seconds, reserve with an idempotent intent, and track with signed
          webhooks.
        </p>

        <div className="mt-8 flex items-center justify-center gap-3">
          <Link href="/demo">
            <Button size="lg">
              Try the demo
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <Link href="/admin/pools">
            <Button size="lg" variant="outline">
              Ops dashboard
            </Button>
          </Link>
        </div>

        <HeroStrip />
      </section>

      <section className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-6 pb-4 md:grid-cols-3">
        <Feature
          icon={<Boxes className="h-5 w-5" />}
          title="Buyer-driven pooling"
          text="Join an open pool on your lane. We combine compatible freight to optimize cost & transit."
        />
        <Feature
          icon={<DollarSign className="h-5 w-5" />}
          title="Transparent pricing"
          text="Simple tiers per kg / m³. Quotes reflect lane rules and capacity."
        />
        <Feature
          icon={<Zap className="h-5 w-5" />}
          title="API-first"
          text="Quote, intent, events, and webhooks out of the box. Integrate in an afternoon."
        />
      </section>

      <section className="mx-auto max-w-6xl px-6 py-8">
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="font-heading">How it works</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="grid gap-4 md:grid-cols-4">
              <Step n={1} title="Get a quote">
                Enter lane, weight & dims — see price and ETA instantly.
              </Step>
              <Step n={2} title="Submit intent">
                Reserve space with an idempotent API call or the checkout widget.
              </Step>
              <Step n={3} title="Pool fills">
                Items are assigned to an open pool; receive <code>fill_80/90/100</code> events.
              </Step>
              <Step n={4} title="Ship & track">
                Ops flips status booked → in_transit → arrived. You get signed webhooks.
              </Step>
            </ol>
            <div className="mt-6 flex gap-3">
              <Link href="/docs">
                <Button variant="outline">View API docs</Button>
              </Link>
              <Link href="/demo">
                <Button>
                  Run the demo
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-6 pb-16 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="font-heading">Built for operators</CardTitle>
            <Truck className="h-5 w-5 text-slate-500" />
          </CardHeader>
          <CardContent className="text-slate-600">
            Lightweight ops views to flip pool status, export CSVs, and keep partners in sync.
            Webhooks retry with backoff.
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="font-heading">Secure & predictable</CardTitle>
            <Shield className="h-5 w-5 text-slate-500" />
          </CardHeader>
          <CardContent className="text-slate-600">
            Signed events (<code>x-containo-signature</code>) and idempotent endpoints prevent
            double booking.
          </CardContent>
        </Card>
      </section>
    </main>
  );
}

function HeroStrip() {
  return (
    <div className="mx-auto mt-12 grid max-w-5xl grid-cols-1 gap-4 md:grid-cols-3">
      <Stat kpi="~35 USD/m³" label="Typical sea consolidation" />
      <Stat kpi="80/90/100%" label="Fill events & cutover" />
      <Stat kpi="< 1 day" label="API integration time" />
    </div>
  );
}

function Stat({ kpi, label }: { kpi: string; label: string }) {
  return (
    <div className="rounded-2xl border bg-white p-4 text-left shadow-sm">
      <div className="font-heading text-xl font-semibold">{kpi}</div>
      <div className="text-sm text-slate-600">{label}</div>
    </div>
  );
}

function Feature({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <Card className="border-slate-200">
      <CardHeader className="flex flex-row items-center gap-2 space-y-0">
        <span className="rounded-lg border bg-white p-2">{icon}</span>
        <CardTitle className="font-heading text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="text-slate-600">{text}</CardContent>
    </Card>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <li className="rounded-xl border bg-white p-4 shadow-sm">
      <div className="mb-1 text-xs font-mono text-slate-500">STEP {n}</div>
      <div className="font-heading text-base font-semibold">{title}</div>
      <p className="mt-1 text-sm text-slate-600">{children}</p>
    </li>
  );
}
