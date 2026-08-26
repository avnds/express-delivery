import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/auth/authorization';

export async function GET() {
  try {
    await requireRole(['OPERATOR', 'SUPERVISOR']);

    const result = await db.execute({
      sql: `
        SELECT
          id,
          name,
          username
        FROM users
        WHERE role = 'COURIER'
          AND active = 1
        ORDER BY name ASC
      `,
      args: [],
    });

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar entregadores:', error);

    return NextResponse.json(
      { error: 'Erro ao buscar entregadores.' },
      { status: 500 }
    );
  }
}