import { redirect } from 'next/navigation';
import { getCurrentSession } from './session';

export type UserRole = 'OPERATOR' | 'SUPERVISOR' | 'COURIER';

export async function requireAuth() {
  const session = await getCurrentSession();

  if (!session) {
    redirect('/login');
  }

  return session;
}

export async function requireRole(allowedRoles: UserRole[]) {
  const session = await requireAuth();

  if (!allowedRoles.includes(session.role as UserRole)) {
    // Usuário autenticado, mas sem permissão.
    // Mandamos para a área correspondente ao seu perfil.
    switch (session.role) {
      case 'SUPERVISOR':
        redirect('/supervisor');

      case 'OPERATOR':
        redirect('/operator');

      case 'COURIER':
        redirect('/courier');

      default:
        redirect('/login');
    }
  }

  return session;
}