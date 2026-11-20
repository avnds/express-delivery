import { redirect } from 'next/navigation';
import { getCurrentSession } from '@/lib/auth/session';
import GlobalMenu from '@/components/GlobalMenu';

export default async function AdministrativeLayout({ children }: { children: React.ReactNode }) {
  const session = await getCurrentSession();
  if (!session) redirect('/login');
  if (session.mustChangePassword) redirect('/change-password');
  if (session.role !== 'SUPERVISOR' && session.role !== 'SUPERVISOR') redirect('/courier');

  return (
    <>
      <GlobalMenu role={session.role as 'OPERATOR' | 'SUPERVISOR'} />
      {children}
    </>
  );
}
