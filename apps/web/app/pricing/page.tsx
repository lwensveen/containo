'use client';

import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { ArrowRight, Plane, Ship } from 'lucide-react';
import { Estimator } from '@/components/pricing/estimator';

export default function PricingPage() {
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
            route—get your exact quote in seconds.
          </p>

          <div className="mt-8 flex items-center justify-center gap-3">
            <Link href="/quote">
              <Button size="lg" className="h-11 px-5">
                Get an instant quote
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
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
          <Estimator />
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
                <Link href="/quote">
                  <Button className="mt-2">Quote for sea</Button>
                </Link>
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
                <Link href="/quote">
                  <Button className="mt-2">Quote for air</Button>
                </Link>
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
                <Link href="/quote">
                  <Button>
                    Get my exact price
                    <ArrowRight className="ml-2 h-4 w-4" />
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
