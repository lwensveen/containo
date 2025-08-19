import type { Metadata } from 'next';
import { AccountView } from '@/components/account/account-view';

export const metadata: Metadata = {
  title: 'Account',
  description: 'Manage your profile, security, and connected accounts.',
};

export default function AccountPage() {
  return <AccountView />;
}
