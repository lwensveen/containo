import Link from 'next/link';
import { Container } from '@/components/layout/container';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Github, Linkedin, Twitter } from 'lucide-react';

type LinkPair = [href: string, label: string];

function FooterCol({ title, links }: { title: string; links: LinkPair[] }) {
  return (
    <nav aria-label={title} className="text-sm">
      <div className="font-semibold text-slate-900">{title}</div>
      <ul className="mt-3 space-y-2">
        {links.map(([href, label]) => (
          <li key={href}>
            <Link href={href} className="text-slate-600 hover:text-slate-900">
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function Footer() {
  return (
    <footer className="border-t bg-white">
      <Container className="py-12">
        <div className="grid gap-10 md:grid-cols-12">
          <div className="md:col-span-5">
            <div className="font-heading text-xl font-bold text-slate-900">Containo</div>
            <p className="mt-2 max-w-sm text-sm text-slate-600">
              Share the space, share the cost. Simple shipping.
            </p>

            <form action="/contact" className="mt-4 flex gap-2">
              <Input type="email" placeholder="Your email" className="h-10" />
              <Button type="submit" className="h-10 px-4">
                Contact
              </Button>
            </form>

            <div className="mt-4 flex items-center gap-2 text-slate-500">
              <Link
                href="https://github.com/lwensveen/containo"
                target="_blank"
                rel="noreferrer"
                aria-label="GitHub"
                className="rounded-md p-2 hover:bg-slate-100"
              >
                <Github className="h-4 w-4" />
              </Link>
              <Link
                href="https://twitter.com"
                target="_blank"
                rel="noreferrer"
                aria-label="Twitter / X"
                className="rounded-md p-2 hover:bg-slate-100"
              >
                <Twitter className="h-4 w-4" />
              </Link>
              <Link
                href="https://www.linkedin.com"
                target="_blank"
                rel="noreferrer"
                aria-label="LinkedIn"
                className="rounded-md p-2 hover:bg-slate-100"
              >
                <Linkedin className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <div className="md:col-span-7">
            <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
              <FooterCol
                title="Product"
                links={[
                  ['/quote', 'Get a quote'],
                  ['/demo', 'Demo'],
                ]}
              />
              <FooterCol
                title="Company"
                links={[
                  ['/about', 'About'],
                  ['/careers', 'Careers'],
                  ['/contact', 'Contact'],
                  ['/admin/pools', 'Ops dashboard'],
                ]}
              />
              <FooterCol
                title="Resources"
                links={[
                  ['/docs', 'API docs'],
                  ['/privacy', 'Privacy'],
                  ['/terms', 'Terms'],
                ]}
              />
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t pt-6 text-xs text-slate-500 md:flex-row">
          <div>© {new Date().getFullYear()} Containo</div>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-slate-700">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-slate-700">
              Terms
            </Link>
            <Link href="/status" className="hover:text-slate-700">
              Status
            </Link>
          </div>
        </div>
      </Container>
    </footer>
  );
}
