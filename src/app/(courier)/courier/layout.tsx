import { requireRole } from '@/lib/auth/authorization';

export default async function CourierLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole(['COURIER']);

  return children;
}