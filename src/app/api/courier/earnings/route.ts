import { NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth/session';
import { db } from '@/lib/db';

export async function GET() {
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

    const result = await db.execute({
      sql: `
        SELECT
          id,
          tracking_code,
          status,
          delivery_fee,
          created_at,
          completion_notes
        FROM deliveries
        WHERE courier_id = ?
          AND status = 'DELIVERED'
        ORDER BY created_at DESC
      `,
      args: [session.userId],
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