import { headers } from 'next/headers';
import { auth } from '@/auth';

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({ headers: await headers() });

  // if (!session) {
  //   redirect('/login');
  // }

  return <>{children}</>;
}
