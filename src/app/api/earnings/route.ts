import { NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth/session';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const session = await getCurrentSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);

    const requestedCourierId = searchParams.get('courier_id');

    let courierId: string;

    if (session.role === 'COURIER') {
      // Entregador só pode consultar os próprios ganhos.
      courierId = String(session.userId);
    } else if (
      session.role === 'OPERATOR' ||
      session.role === 'SUPERVISOR'
    ) {
      // Operador e Supervisor precisam informar qual entregador consultar.
      if (!requestedCourierId) {
        return NextResponse.json(
          { error: 'Entregador não informado' },
          { status: 400 }
        );
      }

      courierId = requestedCourierId;
    } else {
      return NextResponse.json(
        { error: 'Acesso não permitido' },
        { status: 403 }
      );
    }

    // Garante que o usuário consultado é realmente um entregador ativo.
    const courierResult = await db.execute({
      sql: `
        SELECT id
        FROM users
        WHERE id = ?
          AND role = 'COURIER'
          AND active = 1
        LIMIT 1
      `,
      args: [courierId],
    });

    if (courierResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Entregador não encontrado ou inativo' },
        { status: 404 }
      );
    }

    const from = searchParams.get('from');
    const to = searchParams.get('to');

    let dateFilter = '';
    const dateArgs: string[] = [];

    /*
     * SQLite armazena CURRENT_TIMESTAMP em UTC.
     *
     * O Rotix trabalha com horário do Brasil (UTC-3).
     *
     * Exemplo:
     * 2026-08-28 00:00 no Brasil
     * = 2026-08-28 03:00 UTC
     */

    if (from) {
      dateFilter += `
        AND created_at >= datetime(?, '+3 hours')
      `;

      dateArgs.push(`${from} 00:00:00`);
    }

    if (to) {
      dateFilter += `
        AND created_at < datetime(?, '+1 day', '+3 hours')
      `;

      dateArgs.push(`${to} 00:00:00`);
    }

    const result = await db.execute({
      sql: `
        SELECT
          id,
          tracking_code,
          status,
          delivery_fee,
          datetime(created_at, '-3 hours') AS created_at,
          completion_notes
        FROM deliveries
        WHERE courier_id = ?
          AND status = 'DELIVERED'
          ${dateFilter}
        ORDER BY created_at DESC
      `,
      args: [courierId, ...dateArgs],
    });

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar ganhos:', error);

    return NextResponse.json(
      { error: 'Erro ao buscar ganhos' },
      { status: 500 }
    );
  }
}