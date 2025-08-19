import Link from 'next/link';
import {
  ArrowRight,
  Briefcase,
  Clock,
  Coins,
  Globe,
  Laptop,
  MapPin,
  Rocket,
  ShieldCheck,
  Users2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Container } from '@/components/layout/container';
import { Section } from '@/components/layout/section';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Careers',
  description:
    'Join Containo to build pooled shipping—fair prices, predictable ETAs, clear tracking.',
};

type Role = {
  title: string;
  team: string;
  location: string;
  type: 'Full-time' | 'Contract';
  summary: string;
  tags: string[];
  slug?: string;
};

const ROLES: Role[] = [
  {
    title: 'Founding Operations Manager',
    team: 'Operations',
    location: 'EU (Remote)',
    type: 'Full-time',
    summary:
      'Run early lanes (FR↔NL), coordinate pickups, consolidation, and partners. Make fill a KPI.',
    tags: ['Freight Ops', 'Vendors', 'SLA'],
  },
  {
    title: 'Founding Sales Lead',
    team: 'Commercial',
    location: 'EU/UK (Remote)',
    type: 'Full-time',
    summary:
      'Own pipeline from quote → book. Build repeatable playbook for sellers and B2B buyers.',
    tags: ['B2B', 'Lanes', 'CRM'],
  },
  {
    title: 'Senior Full-Stack Engineer',
    team: 'Product & Engineering',
    location: 'Remote (EU/Asia timezones)',
    type: 'Full-time',
    summary:
      'Ship Next.js/TypeScript features across quote, booking, tracking. Pragmatic infra in Postgres.',
    tags: ['TypeScript', 'Next.js', 'Postgres'],
  },
  {
    title: 'Logistics Partnerships Manager',
    team: 'Network',
    location: 'EU (Remote)',
    type: 'Contract',
    summary:
      'Source carriers/forwarders, negotiate lanes and schedules, maintain partner performance.',
    tags: ['Carriers', 'Rates', 'SLAs'],
  },
];

export default function CareersPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-slate-50">
      <Section className="pt-24 pb-12 text-center">
        <Container>
          <h1 className="font-heading mx-auto mt-2 max-w-4xl text-balance text-5xl font-extrabold leading-tight tracking-tight text-slate-900 md:text-6xl">
            Build pooled shipping with us
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg leading-7 text-slate-600">
            We’re a small, hands-on team. If you like ownership, crisp execution, and measurable
            outcomes, you’ll fit right in.
          </p>

          <div className="mt-8 flex items-center justify-center gap-4">
            <Link href="#roles">
              <Button className="h-12 px-8 text-base shadow-lg shadow-blue-500/10 hover:shadow-blue-500/20">
                See open roles
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/about">
              <Button
                variant="outline"
                className="h-12 px-8 text-base border-slate-200/70 hover:bg-white/80"
              >
                About the team
              </Button>
            </Link>
          </div>
        </Container>
      </Section>

      <Section className="pb-12">
        <Container>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <Feature
              icon={<Rocket className="h-5 w-5" />}
              title="Early impact"
              text="Own meaningful slices of product or operations. Ship fast; measure fill and NPS."
            />
            <Feature
              icon={<ShieldCheck className="h-5 w-5" />}
              title="Clear principles"
              text="No surprises: simple pricing, simple processes. Practical beats theoretical."
            />
            <Feature
              icon={<Globe className="h-5 w-5" />}
              title="Remote-first"
              text="Work where you’re effective. We sync across EU/Asia time zones."
            />
          </div>
        </Container>
      </Section>

      <Section id="roles">
        <Container>
          <div className="mb-6 flex items-center gap-3">
            <span className="rounded-lg bg-blue-500/10 p-2 text-blue-600">
              <Briefcase className="h-5 w-5" />
            </span>
            <h2 className="font-heading text-xl text-slate-900">Open roles</h2>
          </div>

          <ul className="grid grid-cols-1 gap-6">
            {ROLES.map((r) => (
              <li key={r.title}>
                <JobCard role={r} />
              </li>
            ))}
          </ul>

          <Card className="mt-6 border-slate-200/70 bg-gradient-to-br from-white to-slate-50">
            <CardContent className="flex flex-col items-center justify-between gap-4 p-6 text-center md:flex-row md:text-left">
              <div>
                <h3 className="font-heading text-xl text-slate-900">Don’t see a perfect fit?</h3>
                <p className="mt-1 max-w-xl text-sm leading-6 text-slate-600">
                  We hire opportunistically for exceptional people. Send a short note about how you
                  can move our KPIs (fill, quote→book, on-time).
                </p>
              </div>
              <a href="mailto:careers@example.com?subject=General%20Application%20%E2%80%93%20Containo">
                <Button className="shadow-blue-500/10 hover:shadow-blue-500/20">
                  Introduce yourself
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </a>
            </CardContent>
          </Card>
        </Container>
      </Section>

      <Section className="pb-20 pt-4">
        <Container>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <Card className="border-slate-200/70 bg-gradient-to-br from-white to-slate-50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <CardTitle className="font-heading text-xl">Hiring process</CardTitle>
                <span className="rounded-lg bg-blue-500/10 p-2 text-blue-600">
                  <Users2 className="h-5 w-5" />
                </span>
              </CardHeader>
              <CardContent className="text-slate-600">
                <ol className="grid gap-3">
                  <Step n={1} title="Intro">
                    20–30 min call. Mutual fit and role expectations.
                  </Step>
                  <Step n={2} title="Deep dive">
                    Case/tech discussion. Real scenarios; no leetcode.
                  </Step>
                  <Step n={3} title="Team chat">
                    Meet the people you’ll work with. Ask hard questions.
                  </Step>
                  <Step n={4} title="Offer">
                    Clear terms, clear goals for your first 90 days.
                  </Step>
                </ol>
              </CardContent>
            </Card>

            <Card className="border-slate-200/70 bg-gradient-to-br from-white to-slate-50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <CardTitle className="font-heading text-xl">Benefits (early stage)</CardTitle>
                <span className="rounded-lg bg-blue-500/10 p-2 text-blue-600">
                  <Coins className="h-5 w-5" />
                </span>
              </CardHeader>
              <CardContent className="text-slate-600">
                <ul className="grid gap-3 md:grid-cols-2">
                  <Benefit
                    icon={<Laptop className="h-4 w-4" />}
                    text="Remote-first, async core hours"
                  />
                  <Benefit icon={<Clock className="h-4 w-4" />} text="Flexible time off" />
                  <Benefit
                    icon={<ShieldCheck className="h-4 w-4" />}
                    text="Clear ownership & scope"
                  />
                  <Benefit icon={<MapPin className="h-4 w-4" />} text="Annual team offsite" />
                </ul>
                <p className="mt-3 text-xs text-slate-500">
                  Note: early-stage benefits evolve as we grow and localize.
                </p>
              </CardContent>
            </Card>
          </div>
        </Container>
      </Section>
    </main>
  );
}

/* ---------------- Local UI helpers ---------------- */

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
        <h4 className="mb-1 font-heading text-lg font-semibold text-slate-900">{title}</h4>
        <p className="text-sm leading-6 text-slate-600">{children}</p>
      </div>
    </li>
  );
}

function Benefit({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <li className="flex items-center gap-2 rounded-md bg-white/80 p-3 ring-1 ring-slate-900/10">
      <span className="rounded-md bg-blue-500/10 p-1.5 text-blue-600">{icon}</span>
      <span className="text-sm">{text}</span>
    </li>
  );
}

function JobCard({ role }: { role: Role }) {
  const mailto = `mailto:careers@example.com?subject=${encodeURIComponent(
    `${role.title} – Application`
  )}`;
  return (
    <Card className="border-slate-200/70 bg-gradient-to-br from-white to-slate-50 transition-shadow hover:shadow-md">
      <CardContent className="p-5">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-heading text-lg text-slate-900">{role.title}</h3>
              <span className="rounded-full bg-blue-500/10 px-2.5 py-0.5 text-xs text-blue-700 ring-1 ring-blue-500/20">
                {role.team}
              </span>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-slate-600">
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" /> {role.location}
              </span>
              <span className="inline-flex items-center gap-1">
                <Briefcase className="h-3.5 w-3.5" /> {role.type}
              </span>
            </div>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">{role.summary}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {role.tags.map((t) => (
                <span
                  key={t}
                  className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-700 ring-1 ring-slate-200"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            {role.slug ? (
              <Link href={`/careers/${role.slug}`}>
                <Button variant="outline" className="border-slate-200/70 hover:bg-white/80">
                  View details
                </Button>
              </Link>
            ) : null}
            <a href={mailto}>
              <Button className="shadow-blue-500/10 hover:shadow-blue-500/20">
                Apply
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </a>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
