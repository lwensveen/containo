import Link from 'next/link';
import { ArrowRight, Boxes, DollarSign, Shield, Truck, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Container } from '@/components/layout/container';
import { Section } from '@/components/layout/section';

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-slate-50">
      <Section className="pt-24 pb-16 text-center">
        <Container>
          <h1 className="font-heading mx-auto mt-2 max-w-4xl text-balance text-5xl font-extrabold leading-tight tracking-tight text-slate-900 md:text-6xl lg:text-7xl">
            Pool shipments,{' '}
            <span className="bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
              share the space
            </span>
            , pay less
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg leading-7 text-slate-600">
            Containo groups compatible shipments on popular routes. You only pay for the space you
            use. Get a price in seconds and reserve your spot. We keep you updated until delivery.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/quote">
              <Button
                size="lg"
                className="h-12 px-8 text-base shadow-lg shadow-blue-500/10 hover:shadow-blue-500/20"
              >
                Get a quote
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/demo">
              <Button
                size="lg"
                variant="outline"
                className="h-12 px-8 text-base border-slate-200/70 hover:bg-white/80"
              >
                See how it works
              </Button>
            </Link>
          </div>

          <HeroStrip />
        </Container>
      </Section>

      <Section className="pb-16">
        <Container>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <Feature
              icon={<Boxes className="h-5 w-5" />}
              title="Pay only for your share"
              text="Your order rides with others on the same lane. That’s how we cut costs while keeping ETAs reliable."
            />
            <Feature
              icon={<DollarSign className="h-5 w-5" />}
              title="Straightforward pricing"
              text="Simple price per kg / m³. No surprise fees. You see the total before you book."
            />
            <Feature
              icon={<Zap className="h-5 w-5" />}
              title="Fast when you need it"
              text="Choose sea for best price or air for speed. Switch anytime—your order still pools with others."
            />
          </div>
        </Container>
      </Section>

      <Section>
        <Container>
          <Card className="border-slate-200/70 bg-gradient-to-br from-white to-slate-50 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="font-heading text-2xl tracking-tight">How it works</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <ol className="grid gap-6 md:grid-cols-4">
                <Step n={1} title="Tell us where">
                  Pick origin & destination, add weight and size. We show price and ETA.
                </Step>
                <Step n={2} title="Reserve your spot">
                  Book your share in the next pool. No minimums or long forms.
                </Step>
                <Step n={3} title="We pack with others">
                  We group compatible shipments and load when the pool is ready.
                </Step>
                <Step n={4} title="Track to delivery">
                  Live status updates from pickup to arrival. We’ll let you know at each step.
                </Step>
              </ol>

              <div className="mt-8 flex flex-wrap gap-4">
                <Link href="/quote">
                  <Button className="shadow-blue-500/10 hover:shadow-blue-500/20">
                    Get my price
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/demo">
                  <Button variant="outline" className="border-slate-200/70 hover:bg-white/80">
                    Watch the flow
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </Container>
      </Section>

      <Section className="pb-20 pt-4">
        <Container>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <Card className="border-slate-200/70 bg-gradient-to-br from-white to-slate-50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <CardTitle className="font-heading text-xl">Clear tracking</CardTitle>
                <span className="rounded-lg bg-blue-500/10 p-2 text-blue-600">
                  <Truck className="h-5 w-5" />
                </span>
              </CardHeader>
              <CardContent className="text-slate-600">
                Follow your shipment from booked → in transit → arrived. We’ll keep you posted—no
                chasing.
              </CardContent>
            </Card>

            <Card className="border-slate-200/70 bg-gradient-to-br from-white to-slate-50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <CardTitle className="font-heading text-xl">No surprises</CardTitle>
                <span className="rounded-lg bg-blue-500/10 p-2 text-blue-600">
                  <Shield className="h-5 w-5" />
                </span>
              </CardHeader>
              <CardContent className="text-slate-600">
                Up-front price, simple terms, and customer support that answers. Shipping made
                predictable.
              </CardContent>
            </Card>
          </div>
        </Container>
      </Section>
    </main>
  );
}

function HeroStrip() {
  return (
    <div className="mx-auto mt-16 max-w-4xl">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Stat kpi="From ~$35" label="Typical sea share" />
        <Stat kpi="From ~$90" label="Typical air share" />
        <Stat kpi="Minutes to start" label="Online quote & booking" />
      </div>
    </div>
  );
}

function Stat({ kpi, label }: { kpi: string; label: string }) {
  return (
    <div className="rounded-xl bg-white/80 p-5 text-left shadow-sm ring-1 ring-slate-900/10 backdrop-blur-sm">
      <div className="font-heading text-2xl font-semibold text-slate-900">{kpi}</div>
      <div className="mt-1 text-sm text-slate-600">{label}</div>
    </div>
  );
}

function Feature({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <Card className="border-slate-200/70 bg-gradient-to-b from-white to-slate-50 transition-shadow hover:shadow-md">
      <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-4">
        <span className="rounded-lg bg-blue-500/10 p-2.5 text-blue-600">{icon}</span>
        <CardTitle className="font-heading text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="text-slate-600">{text}</CardContent>
    </Card>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <li className="group relative rounded-xl bg-white/80 p-5 shadow-sm ring-1 ring-slate-900/10 transition-all hover:shadow-md">
      <div className="absolute -left-2 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 text-sm font-bold text-white shadow-md shadow-blue-500/20">
        {n}
      </div>
      <div className="ml-6">
        <h3 className="mb-2 font-heading text-lg font-semibold text-slate-900">{title}</h3>
        <p className="text-sm leading-6 text-slate-600">{children}</p>
      </div>
    </li>
  );
}
