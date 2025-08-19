import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalLayout } from '@/components/layout/legal-layout';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'The rules and conditions for using Containo’s services.',
};

const toc = [
  { id: 'accept', label: 'Acceptance' },
  { id: 'accounts', label: 'Accounts' },
  { id: 'quotes', label: 'Quotes & bookings' },
  { id: 'payments', label: 'Payments & refunds' },
  { id: 'ship', label: 'Shipping & pooling' },
  { id: 'customs', label: 'Customs & taxes' },
  { id: 'use', label: 'Acceptable use' },
  { id: 'third', label: 'Third parties' },
  { id: 'warranty', label: 'No warranties' },
  { id: 'liability', label: 'Liability' },
  { id: 'indemnity', label: 'Indemnity' },
  { id: 'termination', label: 'Termination' },
  { id: 'law', label: 'Governing law' },
  { id: 'changes', label: 'Changes' },
  { id: 'contact', label: 'Contact' },
];

export default function Terms() {
  return (
    <LegalLayout
      title="Terms of Service"
      description="Please read these terms carefully. They govern use of Containo’s website and services."
      updatedAt="2025-08-19"
      toc={toc}
    >
      <Section id="accept" t="Acceptance of terms">
        <p>
          By accessing or using our services, you agree to these Terms and our{' '}
          <Link href="/privacy" className="underline">
            Privacy Policy
          </Link>
          . If you use the services on behalf of a company, you represent you’re authorized to bind
          that company.
        </p>
      </Section>

      <Section id="accounts" t="Accounts & eligibility">
        <ul className="list-disc space-y-2 pl-5">
          <li>Provide accurate information and keep it updated.</li>
          <li>Safeguard credentials; you’re responsible for use of your account.</li>
          <li>You must be legally able to enter into contracts in your jurisdiction.</li>
        </ul>
      </Section>

      <Section id="quotes" t="Quotes & bookings">
        <ul className="list-disc space-y-2 pl-5">
          <li>Quotes are estimates based on data you provide and are valid for a limited time.</li>
          <li>
            Booking confirms space within a pool; timing depends on pool readiness and carrier
            schedules.
          </li>
          <li>
            We may reject, cancel, or reprioritize a booking if information is incomplete, unlawful,
            or inaccurate.
          </li>
        </ul>
      </Section>

      <Section id="payments" t="Payments, fees & refunds">
        <ul className="list-disc space-y-2 pl-5">
          <li>
            Payments are processed by our payment service provider; verification may be required.
          </li>
          <li>
            Certain fees (e.g., storage, re-delivery, brokerage) may apply depending on your
            shipment.
          </li>
          <li>
            Refunds follow our policy and carrier rules; some services are non-refundable once
            executed.
          </li>
        </ul>
      </Section>

      <Section id="ship" t="Shipping, pooling, and ETAs">
        <ul className="list-disc space-y-2 pl-5">
          <li>Pools consolidate compatible shipments; ETAs are estimates and not guarantees.</li>
          <li>
            You’re responsible for lawful declarations and packaging; we may refuse prohibited or
            unsafe items.
          </li>
          <li>Risk of loss may pass according to applicable Incoterms/carrier terms.</li>
        </ul>
      </Section>

      <Section id="customs" t="Customs, duties, and taxes">
        <ul className="list-disc space-y-2 pl-5">
          <li>
            You’re responsible for accurate customs documentation and any duties, VAT, or taxes
            unless agreed otherwise.
          </li>
          <li>
            We or partners may act as your agent/broker where permitted; additional info may be
            required.
          </li>
        </ul>
      </Section>

      <Section id="use" t="Acceptable use">
        <ul className="list-disc space-y-2 pl-5">
          <li>
            No unlawful, infringing, or dangerous goods. Follow all sanctions/export controls.
          </li>
          <li>No abuse of our systems (e.g., scraping without permission, attacks, fraud).</li>
        </ul>
      </Section>

      <Section id="third" t="Third-party services">
        <p>
          We rely on carriers, brokers, PSPs, and other providers. Their terms may apply in addition
          to ours; we’re not responsible for third-party content or services we don’t control.
        </p>
      </Section>

      <Section id="warranty" t="Disclaimers (no warranties)">
        <p>
          Services are provided “as is” and “as available.” We disclaim all warranties permitted by
          law, including implied warranties of merchantability, fitness, and non-infringement.
        </p>
      </Section>

      <Section id="liability" t="Limitation of liability">
        <p>
          To the maximum extent permitted, Containo and its suppliers are not liable for indirect,
          incidental, special, consequential, or punitive damages, or lost profits/revenue/data. Our
          aggregate liability is limited to the amounts you paid to us for the service giving rise
          to the claim in the 6 months before the event.
        </p>
      </Section>

      <Section id="indemnity" t="Indemnification">
        <p>
          You agree to defend, indemnify, and hold harmless Containo from claims and expenses
          arising from your use of the services or breach of these Terms, except to the extent
          caused by our willful misconduct.
        </p>
      </Section>

      <Section id="termination" t="Suspension & termination">
        <p>
          We may suspend or terminate access for breach, risk, or legal reasons. You may stop using
          the services at any time. Certain obligations (fees owed, confidentiality, IP,
          limitations, indemnity) survive termination.
        </p>
      </Section>

      <Section id="law" t="Governing law & venue">
        <p>
          These Terms are governed by the laws of [Your Governing Law]. Exclusive jurisdiction and
          venue lie in the courts of [Your Venue]. Consumers may have mandatory local rights.
        </p>
      </Section>

      <Section id="changes" t="Changes to the Terms">
        <p>
          We’ll post updates here and adjust the “Last updated” date. Material changes may be
          notified by email or in-app.
        </p>
      </Section>

      <Section id="contact" t="Contact">
        <p>
          Containo — Legal
          <br />
          Email:{' '}
          <Link href="mailto:legal@example.com" className="underline">
            legal@example.com
          </Link>
          <br />
          Address: [Your Company Address]
        </p>
      </Section>
    </LegalLayout>
  );
}

function Section({ id, t, children }: { id: string; t: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24 space-y-3">
      <h2 className="font-heading text-2xl font-semibold text-slate-900">{t}</h2>
      <div className="text-sm leading-6">{children}</div>
    </section>
  );
}
