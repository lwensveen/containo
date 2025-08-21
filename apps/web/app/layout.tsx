import type { Metadata } from 'next';
import './globals.css';
import { Header } from '@/components/layout/header';
import { Roboto_Flex, Source_Sans_3 } from 'next/font/google';
import { Footer } from '@/components/layout/footer';
import CookieConsent from '@/components/cookies/cookie-consent';

const robotoFlex = Roboto_Flex({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-heading',
});

const sourceSans3 = Source_Sans_3({
  subsets: ['latin'],
  weight: ['400', '500'],
  display: 'swap',
  variable: '--font-body',
});

export const metadata: Metadata = {
  title: 'Containo',
  description: 'Pool small shipments. Pay less. Ship faster.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body
        className={`${robotoFlex.variable} ${sourceSans3.variable} min-h-screen bg-white text-slate-900`}
      >
        <Header />
        <main className="min-h-[calc(100vh-64px)]">{children}</main>
        <Footer />
        <CookieConsent />
      </body>
    </html>
  );
}
