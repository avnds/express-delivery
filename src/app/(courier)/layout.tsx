import { redirect } from 'next/navigation';
import { getCurrentSession } from '@/lib/auth/session';
import GlobalMenu from '@/components/GlobalMenu';

export default async function CourierLayout({ children }: { children: React.ReactNode }) {
  const session = await getCurrentSession();
  if (!session) redirect('/login');
  if (session.mustChangePassword) redirect('/change-password');
  if (session.role !== 'COURIER') redirect(session.role === 'SUPERVISOR' ? '/supervisor' : '/operator');

  return (
    <>
      <GlobalMenu role="COURIER" />
      {children}
    </>
  );
}
