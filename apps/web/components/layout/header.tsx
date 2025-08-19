'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/layout/container';
import { authClient } from '@/lib/auth-client';

type NavItem = { href: string; label: string };
const PUBLIC_NAV: NavItem[] = [
  { href: '/', label: 'Home' },
  { href: '/quote', label: 'Quote' },
  { href: '/about', label: 'About' },
  { href: '/careers', label: 'Careers' },
  { href: '/contact', label: 'Contact' },
];

function isActive(pathname: string, href: string) {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(href + '/');
}

export function Header() {
  const pathname = usePathname();
  const { data: session } = authClient.useSession();
  const authed = !!session;

  return (
    <Container>
      <header>
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-bold tracking-tight">Containo</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            {PUBLIC_NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'text-sm font-medium transition-colors hover:text-primary',
                  isActive(pathname, item.href) ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                {item.label}
              </Link>
            ))}
            {authed && (
              <Link
                href="/admin"
                className={cn(
                  'text-sm font-medium transition-colors hover:text-primary',
                  isActive(pathname, '/admin') ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                Admin
              </Link>
            )}
          </nav>

          <div className="flex items-center gap-3">
            {authed ? (
              <>
                <Button variant="outline" asChild>
                  <Link href="/dashboard">Dashboard</Link>
                </Button>
                <Button onClick={() => authClient.signOut()} variant="ghost" className="text-sm">
                  Log out
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" asChild>
                  <Link href="/login">Log in</Link>
                </Button>
                <Button asChild>
                  <Link href="/signup">Sign up</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>
    </Container>
  );
}
