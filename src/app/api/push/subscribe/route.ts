import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { getCurrentSession } from '@/lib/auth/session';
import { db } from '@/lib/db';

export async function POST(request: Request) {
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

    const body = await request.json();

    const endpoint = body?.endpoint;
    const p256dh = body?.keys?.p256dh;
    const auth = body?.keys?.auth;

    if (
      typeof endpoint !== 'string' ||
      typeof p256dh !== 'string' ||
      typeof auth !== 'string'
    ) {
      return NextResponse.json(
        { error: 'Assinatura push inválida' },
        { status: 400 }
      );
    }

    await db.execute({
      sql: `
        INSERT INTO push_subscriptions (
          id,
          user_id,
          endpoint,
          p256dh,
          auth
        )
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(endpoint)
        DO UPDATE SET
          user_id = excluded.user_id,
          p256dh = excluded.p256dh,
          auth = excluded.auth,
          updated_at = CURRENT_TIMESTAMP
      `,
      args: [
        randomUUID(),
        session.userId,
        endpoint,
        p256dh,
        auth,
      ],
    });

    return NextResponse.json({
      success: true,
      message: 'Notificações ativadas',
    });
  } catch (error) {
    console.error(
      '[Rotix] Erro ao salvar push subscription:',
      error
    );

    return NextResponse.json(
      { error: 'Erro ao salvar assinatura de notificações' },
      { status: 500 }
    );
  }
}