import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalLayout } from '@/components/layout/legal-layout';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'How Containo collects, uses, and protects your information.',
};

const toc = [
  { id: 'collect', label: 'What we collect' },
  { id: 'use', label: 'How we use data' },
  { id: 'legal', label: 'Legal basis' },
  { id: 'share', label: 'Sharing' },
  { id: 'retention', label: 'Retention' },
  { id: 'intl', label: 'International transfers' },
  { id: 'security', label: 'Security' },
  { id: 'cookies', label: 'Cookies' },
  { id: 'rights', label: 'Your rights' },
  { id: 'children', label: 'Children' },
  { id: 'changes', label: 'Changes' },
  { id: 'contact', label: 'Contact' },
];

export default function Privacy() {
  return (
    <LegalLayout
      title="Privacy Policy"
      description="We only collect what’s needed to quote, book, and track shipments—no surprises."
      updatedAt="2025-08-19"
      toc={toc}
    >
      <SectionBlock id="collect" title="Information we collect">
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <b>Account & contact.</b> Name, email, phone, company.
          </li>
          <li>
            <b>Shipment details.</b> Origin/destination, weights, dimensions, commodity
            descriptions, Incoterms, declared values, pickup/delivery addresses.
          </li>
          <li>
            <b>Transaction.</b> Bookings, invoices, payment status (PSP handles card data).
          </li>
          <li>
            <b>Usage.</b> Device info, logs, approximate location, cookies.
          </li>
        </ul>
      </SectionBlock>

      <SectionBlock id="use" title="How we use your information">
        <ul className="list-disc space-y-2 pl-5">
          <li>Provide quotes, bookings, pooling, and tracking.</li>
          <li>Customer support and service notifications.</li>
          <li>Billing, fraud prevention, and legal compliance.</li>
          <li>Product analytics and service improvement (aggregated/limited where possible).</li>
          <li>Marketing with your consent; you can opt out anytime.</li>
        </ul>
      </SectionBlock>

      <SectionBlock id="legal" title="Legal bases (EU/EEA)">
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <b>Contract</b> – perform our agreement (quotes, bookings, support).
          </li>
          <li>
            <b>Legitimate interests</b> – service safety, improvement, fraud prevention.
          </li>
          <li>
            <b>Consent</b> – optional marketing, certain cookies.
          </li>
          <li>
            <b>Legal obligation</b> – customs, tax, accounting, sanctions screening.
          </li>
        </ul>
      </SectionBlock>

      <SectionBlock id="share" title="Sharing">
        <ul className="list-disc space-y-2 pl-5">
          <li>Carriers/forwarders and logistics partners to fulfill shipments.</li>
          <li>Payment processors for billing.</li>
          <li>Compliance vendors (e.g., customs brokers) where necessary.</li>
          <li>Service providers (hosting, analytics, email) under contract.</li>
          <li>Authorities when legally required.</li>
        </ul>
      </SectionBlock>

      <SectionBlock id="retention" title="Retention">
        <p>
          We keep data only as long as needed for the purposes above: typically the life of the
          account plus statutory periods for tax/accounting and claim handling, then delete or
          anonymize.
        </p>
      </SectionBlock>

      <SectionBlock id="intl" title="International transfers">
        <p>
          Data may be transferred across borders. Where required, we use safeguards (e.g., EU
          Standard Contractual Clauses) and assess partner protections.
        </p>
      </SectionBlock>

      <SectionBlock id="security" title="Security">
        <p>
          We use industry-standard controls (encryption in transit, access controls, monitoring). No
          method is 100% secure; we work to continually improve.
        </p>
      </SectionBlock>

      <SectionBlock id="cookies" title="Cookies & similar tech">
        <p>
          Essential cookies for auth/functionality; optional analytics/marketing cookies with
          consent. Manage preferences in your browser or via our cookie banner (where available).
        </p>
      </SectionBlock>

      <SectionBlock id="rights" title="Your rights">
        <ul className="list-disc space-y-2 pl-5">
          <li>Access, correct, delete, or export your data.</li>
          <li>Object or restrict certain processing.</li>
          <li>Withdraw consent where applicable.</li>
          <li>Complain to your local data protection authority.</li>
        </ul>
        <p className="mt-3 text-sm">
          Send requests to{' '}
          <Link href="mailto:privacy@example.com" className="underline">
            privacy@example.com
          </Link>
          .
        </p>
      </SectionBlock>

      <SectionBlock id="children" title="Children">
        <p>
          Our services aren’t directed to children under 16 and we don’t knowingly collect their
          data.
        </p>
      </SectionBlock>

      <SectionBlock id="changes" title="Changes to this policy">
        <p>We’ll update this page when policies change and adjust the “Last updated” date.</p>
      </SectionBlock>

      <SectionBlock id="contact" title="Contact">
        <p>
          Containo — Privacy
          <br />
          Email:{' '}
          <Link href="mailto:privacy@example.com" className="underline">
            privacy@example.com
          </Link>
          <br />
          Address: [Your Company Address]
        </p>
      </SectionBlock>
    </LegalLayout>
  );
}

function SectionBlock({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24 space-y-3">
      <h2 className="font-heading text-2xl font-semibold text-slate-900">{title}</h2>
      <div className="text-sm leading-6">{children}</div>
    </section>
  );
}
