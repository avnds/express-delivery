/*import { requireRole } from '@/lib/auth/authorization';

export default async function SupervisorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole(['SUPERVISOR']);

  return children;
}*/

import type { Metadata } from 'next';
import { requireRole } from '@/lib/auth/authorization';

export const metadata: Metadata = {
  title: 'Supervisor',
};

export default async function SupervisorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole(['SUPERVISOR']);

  return children;
}