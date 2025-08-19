import Link from 'next/link';
import { ArrowRight, Briefcase, Globe, MapPin, Shield, Target, Users2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Container } from '@/components/layout/container';
import { Section } from '@/components/layout/section';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About',
  description: 'Meet the team behind Containo and learn why we’re building pooled shipping.',
};

const TEAM: Array<{
  name: string;
  role: string;
  initials: string;
  location?: string;
}> = [
  {
    name: 'Lodewijk Wensveen',
    role: 'Founder • Full-stack',
    initials: 'LW',
    location: 'Bangkok, TH',
  },
  { name: 'Founding Ops', role: 'Operations • Freight', initials: 'FO', location: 'EU (Remote)' },
  {
    name: 'Founding Sales',
    role: 'Sales • Partnerships',
    initials: 'FS',
    location: 'EU/UK (Remote)',
  },
];

export default function About() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-slate-50">
      <Section className="pt-24 pb-12 text-center">
        <Container>
          <h1 className="font-heading mx-auto mt-2 max-w-4xl text-balance text-5xl font-extrabold leading-tight tracking-tight text-slate-900 md:text-6xl">
            The team making shipping fair through pooling
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg leading-7 text-slate-600">
            We’re building Containo so smaller senders get enterprise-grade rates, reliability, and
            tracking—without the lock-in or fine print.
          </p>

          <div className="mt-8 flex items-center justify-center gap-4">
            <Link href="/quote">
              <Button className="h-12 px-8 text-base shadow-lg shadow-blue-500/10 hover:shadow-blue-500/20">
                Get a quote
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/contact">
              <Button
                variant="outline"
                className="h-12 px-8 text-base border-slate-200/70 hover:bg-white/80"
              >
                Contact us
              </Button>
            </Link>
          </div>
        </Container>
      </Section>

      <Section className="pb-12">
        <Container>
          <Card className="border-slate-200/70 bg-gradient-to-br from-white to-slate-50 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="font-heading text-2xl tracking-tight">Our story</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 text-slate-600">
              <p className="leading-7">
                Shipping is either cheap and slow or fast and expensive—and usually opaque. We
                started Containo to pool compatible shipments on popular lanes so everyone pays only
                for the space they use. Clear prices, predictable ETAs, and live tracking—without
                enterprise contracts.
              </p>
            </CardContent>
          </Card>
        </Container>
      </Section>

      <Section className="pb-12">
        <Container>
          <div className="mb-6 flex items-center gap-3">
            <span className="rounded-lg bg-blue-500/10 p-2 text-blue-600">
              <Users2 className="h-5 w-5" />
            </span>
            <h2 className="font-heading text-xl text-slate-900">Team</h2>
          </div>

          <ul className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {TEAM.map((m) => (
              <li key={m.name}>
                <Card className="border-slate-200/70 bg-gradient-to-b from-white to-slate-50 transition-shadow hover:shadow-md">
                  <CardContent className="flex items-center gap-4 p-5">
                    <Avatar initials={m.initials} />
                    <div>
                      <div className="font-medium text-slate-900">{m.name}</div>
                      <div className="text-sm text-slate-600">{m.role}</div>
                      {m.location && (
                        <div className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                          <MapPin className="h-3.5 w-3.5" />
                          <span>{m.location}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      <Section>
        <Container>
          <div className="mb-6 flex items-center gap-3">
            <span className="rounded-lg bg-blue-500/10 p-2 text-blue-600">
              <Target className="h-5 w-5" />
            </span>
            <h2 className="font-heading text-xl text-slate-900">What we value</h2>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <Value
              icon={<Shield className="h-5 w-5" />}
              title="No surprises"
              text="Up-front pricing, simple terms, and clear comms. If something slips, you hear it from us first."
            />
            <Value
              icon={<Globe className="h-5 w-5" />}
              title="Pooled efficiency"
              text="Fill is a first-class metric. Higher utilization drives lower cost and fewer empty miles."
            />
            <Value
              icon={<Briefcase className="h-5 w-5" />}
              title="Operator mindset"
              text="We ship real freight. Practical > theoretical. Bias to action and measurable outcomes."
            />
          </div>
        </Container>
      </Section>

      <Section>
        <Container>
          <Card className="border-slate-200/70 bg-gradient-to-br from-white to-slate-50 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="font-heading text-2xl tracking-tight">Timeline</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <ol className="grid gap-6 md:grid-cols-3">
                <Milestone
                  k="2025 Q3"
                  t="Prototype"
                  d="Quote → book → basic tracking on first lanes."
                />
                <Milestone
                  k="2025 Q4"
                  t="Pilot pools"
                  d="France ↔ NL lanes; pool fill targets & live ops."
                />
                <Milestone
                  k="2026 H1"
                  t="Scale"
                  d="More EU↔Asia lanes, richer events, seller tools."
                />
              </ol>
            </CardContent>
          </Card>
        </Container>
      </Section>

      <Section className="pb-20 pt-4">
        <Container>
          <Card className="border-slate-200/70 bg-gradient-to-br from-white to-slate-50">
            <CardContent className="flex flex-col items-center justify-between gap-4 p-6 text-center md:flex-row md:text-left">
              <div>
                <h3 className="font-heading text-xl text-slate-900">Join the journey</h3>
                <p className="mt-1 max-w-xl text-sm leading-6 text-slate-600">
                  We’re looking for founding teammates across Ops and Sales. If you like building
                  from first principles, let’s talk.
                </p>
              </div>
              <div className="flex gap-3">
                <Link href="/contact">
                  <Button className="shadow-blue-500/10 hover:shadow-blue-500/20">
                    Get in touch
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/quote">
                  <Button variant="outline" className="border-slate-200/70 hover:bg-white/80">
                    Get a quote
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </Container>
      </Section>
    </main>
  );
}

function Avatar({ initials }: { initials: string }) {
  return (
    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/10 text-sm font-semibold text-blue-700 ring-1 ring-blue-500/20">
      {initials}
    </div>
  );
}

function Value({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
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

function Milestone({ k, t, d }: { k: string; t: string; d: string }) {
  return (
    <li className="group relative rounded-xl bg-white/80 p-5 shadow-sm ring-1 ring-slate-900/10 transition-all hover:shadow-md">
      <div className="absolute -left-2 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 text-sm font-bold text-white shadow-md shadow-blue-500/20"></div>
      <div className="ml-6">
        <div className="text-xs uppercase tracking-wide text-slate-500">{k}</div>
        <h4 className="mb-1 font-heading text-lg font-semibold text-slate-900">{t}</h4>
        <p className="text-sm leading-6 text-slate-600">{d}</p>
      </div>
    </li>
  );
}
