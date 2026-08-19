/*import { requireRole } from '@/lib/auth/authorization';

export default async function OperatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole(['OPERATOR', 'SUPERVISOR']);

  return children;
}*/

import type { Metadata } from 'next';
import { requireRole } from '@/lib/auth/authorization';

export const metadata: Metadata = {
  title: 'Operador',
};

export default async function OperatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole(['OPERATOR', 'SUPERVISOR']);

  return children;
}