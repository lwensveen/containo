import Link from 'next/link';
import { ArrowRight, Building, Clock, Mail, MapPin, MessageSquare, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Container } from '@/components/layout/container';
import { Section } from '@/components/layout/section';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Get in touch with Containo for support, sales, and partnerships.',
};

export default function Contact() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-slate-50">
      <Section className="pt-24 pb-12 text-center">
        <Container>
          <h1 className="font-heading mx-auto mt-2 max-w-4xl text-balance text-5xl font-extrabold leading-tight tracking-tight text-slate-900 md:text-6xl">
            Talk to the team
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg leading-7 text-slate-600">
            Questions about pricing, a shipment, or partnerships? Send us a note— we’ll route it to
            the right person.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <a href="mailto:hello@example.com">
              <Button
                size="lg"
                className="h-12 px-8 text-base shadow-lg shadow-blue-500/10 hover:shadow-blue-500/20"
              >
                Email us
                <Mail className="ml-2 h-4 w-4" />
              </Button>
            </a>
            <Link href="/quote">
              <Button
                size="lg"
                variant="outline"
                className="h-12 px-8 text-base border-slate-200/70 hover:bg-white/80"
              >
                Get a quote
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </Container>
      </Section>

      <Section className="pb-12">
        <Container>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <ContactCard
              icon={<MessageSquare className="h-5 w-5" />}
              title="Support"
              text="Shipment questions, tracking, changes."
              cta={
                <a href="mailto:support@example.com" className="text-sm text-blue-600 underline">
                  support@example.com
                </a>
              }
            />
            <ContactCard
              icon={<Building className="h-5 w-5" />}
              title="Sales"
              text="Volume, lanes, and custom pricing."
              cta={
                <a href="mailto:sales@example.com" className="text-sm text-blue-600 underline">
                  sales@example.com
                </a>
              }
            />
            <ContactCard
              icon={<Phone className="h-5 w-5" />}
              title="Phone"
              text="Prefer a call? Leave your number and time."
              cta={
                <a
                  href="mailto:hello@example.com?subject=Call%20request"
                  className="text-sm text-blue-600 underline"
                >
                  Request a call
                </a>
              }
            />
          </div>
        </Container>
      </Section>

      <Section>
        <Container>
          <Card className="border-slate-200/70 bg-gradient-to-br from-white to-slate-50 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="font-heading text-2xl tracking-tight">Send a message</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <form action="/api/contact" method="post" className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-1">
                  <label htmlFor="name" className="text-sm font-medium">
                    Name
                  </label>
                  <input
                    id="name"
                    name="name"
                    className="h-10 rounded-md border px-3 outline-none focus:ring"
                    placeholder="Ada Lovelace"
                    required
                  />
                </div>
                <div className="grid gap-1">
                  <label htmlFor="email" className="text-sm font-medium">
                    Email
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    className="h-10 rounded-md border px-3 outline-none focus:ring"
                    placeholder="you@example.com"
                    required
                  />
                </div>
                <div className="md:col-span-2 grid gap-1">
                  <label htmlFor="subject" className="text-sm font-medium">
                    Subject
                  </label>
                  <input
                    id="subject"
                    name="subject"
                    className="h-10 rounded-md border px-3 outline-none focus:ring"
                    placeholder="Pricing on FR → NL sea share"
                  />
                </div>
                <div className="md:col-span-2 grid gap-1">
                  <label htmlFor="message" className="text-sm font-medium">
                    Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={6}
                    className="rounded-md border px-3 py-2 outline-none focus:ring"
                    placeholder="Tell us what you want to ship, lane, weight/volume, and dates."
                  />
                </div>
                <div className="md:col-span-2">
                  <Button type="submit" className="shadow-blue-500/10 hover:shadow-blue-500/20">
                    Send message
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </Container>
      </Section>

      <Section className="pb-20 pt-4">
        <Container>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <Card className="border-slate-200/70 bg-gradient-to-br from-white to-slate-50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <CardTitle className="font-heading text-xl">Where we operate</CardTitle>
                <span className="rounded-lg bg-blue-500/10 p-2 text-blue-600">
                  <MapPin className="h-5 w-5" />
                </span>
              </CardHeader>
              <CardContent className="text-slate-600">
                Popular lanes across EU ↔ Asia and intra-EU. Ask us about a lane if you don’t see
                it in the quote tool.
              </CardContent>
            </Card>

            <Card className="border-slate-200/70 bg-gradient-to-br from-white to-slate-50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <CardTitle className="font-heading text-xl">Response times</CardTitle>
                <span className="rounded-lg bg-blue-500/10 p-2 text-blue-600">
                  <Clock className="h-5 w-5" />
                </span>
              </CardHeader>
              <CardContent className="text-slate-600">
                We aim to reply within one business day. For active shipments, reply to your latest
                email thread for fastest handling.
              </CardContent>
            </Card>
          </div>
        </Container>
      </Section>
    </main>
  );
}

function ContactCard({
  icon,
  title,
  text,
  cta,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
  cta: React.ReactNode;
}) {
  return (
    <Card className="border-slate-200/70 bg-gradient-to-b from-white to-slate-50 transition-shadow hover:shadow-md">
      <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-4">
        <span className="rounded-lg bg-blue-500/10 p-2.5 text-blue-600">{icon}</span>
        <CardTitle className="font-heading text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="text-slate-600">
        <p>{text}</p>
        <div className="mt-3">{cta}</div>
      </CardContent>
    </Card>
  );
}
