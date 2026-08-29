import { NextResponse } from 'next/server';
import webpush from 'web-push';
import { getCurrentSession } from '@/lib/auth/session';
import { db } from '@/lib/db';

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export async function POST() {
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
        SELECT endpoint, p256dh, auth
        FROM push_subscriptions
        WHERE user_id = ?
      `,
      args: [session.userId],
    });

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Nenhuma assinatura encontrada' },
        { status: 404 }
      );
    }

    const payload = JSON.stringify({
      title: '🔔 Teste Rotix',
      body: 'As notificações estão funcionando!',
    });

    for (const row of result.rows) {
      try {
        await webpush.sendNotification(
          {
            endpoint: row.endpoint as string,
            keys: {
              p256dh: row.p256dh as string,
              auth: row.auth as string,
            },
          },
          payload
        );
      } catch (error: any) {
        console.error(
          '[Rotix] Erro ao enviar push:',
          error
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Notificação enviada',
    });
  } catch (error) {
    console.error(
      '[Rotix] Erro no teste de push:',
      error
    );

    return NextResponse.json(
      { error: 'Erro ao enviar notificação' },
      { status: 500 }
    );
  }
}
