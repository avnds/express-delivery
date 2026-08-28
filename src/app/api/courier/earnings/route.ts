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

    if (session.role !== 'COURIER') {
      return NextResponse.json(
        { error: 'Acesso permitido somente para entregadores' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);

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
      args: [session.userId, ...dateArgs],
    });

    return NextResponse.json(result.rows);

  } catch (error) {
    console.error('Erro ao buscar ganhos do entregador:', error);

    return NextResponse.json(
      { error: 'Erro ao buscar ganhos' },
      { status: 500 }
    );
  }
}