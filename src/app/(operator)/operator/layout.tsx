import { requireRole } from '@/lib/auth/authorization';

export default async function OperatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole(['OPERATOR', 'SUPERVISOR']);

  return children;
}