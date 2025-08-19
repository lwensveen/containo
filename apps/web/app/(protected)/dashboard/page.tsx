import type { Metadata } from 'next';
import { DashboardView } from '@/components/dashboard/view';

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'Manage your shipments and pickups.',
};

export default function DashboardPage() {
  return <DashboardView />;
}
