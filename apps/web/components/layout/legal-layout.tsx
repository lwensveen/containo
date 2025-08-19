import Link from 'next/link';
import { Container } from '@/components/layout/container';
import { Section } from '@/components/layout/section';
import { cn } from '@/lib/utils';

type TocItem = { id: string; label: string };
type Props = {
  title: string;
  description?: string;
  updatedAt?: string; // e.g., "2025-08-19"
  toc: TocItem[];
  children: React.ReactNode;
  className?: string;
};

export function LegalLayout({ title, description, updatedAt, toc, children, className }: Props) {
  return (
    <main className={cn('min-h-screen bg-gradient-to-b from-white to-slate-50', className)}>
      <Section className="pt-24 pb-10">
        <Container>
          <h1 className="font-heading text-balance text-5xl font-extrabold tracking-tight text-slate-900 md:text-6xl">
            {title}
          </h1>
          {description ? (
            <p className="mt-6 max-w-2xl text-pretty text-lg leading-7 text-slate-600">
              {description}
            </p>
          ) : null}
          {updatedAt ? (
            <p className="mt-3 text-sm text-slate-500">Last updated: {updatedAt}</p>
          ) : null}
        </Container>
      </Section>

      <Section className="pb-20">
        <Container>
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-[220px_1fr] xl:grid-cols-[260px_1fr]">
            <aside className="lg:sticky lg:top-24 h-max">
              <nav aria-label="Table of contents" className="text-sm">
                <div className="mb-3 font-semibold text-slate-900">On this page</div>
                <ul className="space-y-2">
                  {toc.map((item) => (
                    <li key={item.id}>
                      <Link
                        href={`#${item.id}`}
                        className="block text-slate-600 hover:text-slate-900"
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            </aside>

            <article className="max-w-3xl space-y-10 text-slate-700">{children}</article>
          </div>
        </Container>
      </Section>
    </main>
  );
}
