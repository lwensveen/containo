import type { Metadata } from 'next';
import { Container } from '@/components/layout/container';
import { Section } from '@/components/layout/section';

export const metadata: Metadata = {
  title: 'Status',
  description: 'Current uptime and incident history.',
};

export default function StatusPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-slate-50">
      <Section className="pt-24 pb-10">
        <Container>
          <h1 className="font-heading text-5xl font-extrabold tracking-tight text-slate-900">
            Status
          </h1>
          <p className="mt-4 text-slate-600">All systems operational.</p>
          {/* If/when you use a provider like Instatus/Statuspage, embed their widget here. */}
          {/* <iframe src="https://your.status.page/embed" className="mt-6 h-80 w-full rounded-lg border" /> */}
        </Container>
      </Section>
    </main>
  );
}
