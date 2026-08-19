/*import { requireRole } from '@/lib/auth/authorization';

export default async function CourierLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole(['COURIER']);

  return children;
}*/
import type { Metadata } from 'next';
import { requireRole } from '@/lib/auth/authorization';

export const metadata: Metadata = {
  title: 'Entregador',
};

export default async function CourierLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole(['COURIER']);

  return children;
}