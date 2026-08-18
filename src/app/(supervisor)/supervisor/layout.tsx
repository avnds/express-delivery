import { requireRole } from '@/lib/auth/authorization';

export default async function SupervisorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole(['SUPERVISOR']);

  return children;
}