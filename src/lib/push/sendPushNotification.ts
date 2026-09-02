import webpush from 'web-push';
import { db } from '@/lib/db';

const vapidSubject = process.env.VAPID_SUBJECT;
const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

if (!vapidSubject || !vapidPublicKey || !vapidPrivateKey) {
  throw new Error(
    '[Rotix Push] Variáveis VAPID não configuradas.'
  );
}

webpush.setVapidDetails(
  vapidSubject,
  vapidPublicKey,
  vapidPrivateKey
);

interface PushPayload {
  type: 'NEW_DELIVERY' | 'DATA_CHANGED';
  title: string;
  body: string;
  url?: string;
  deliveryId?: string;
}

export async function sendPushNotification(
  userId: string,
  payload: PushPayload
) {
  const result = await db.execute({
    sql: `
      SELECT
        id,
        endpoint,
        p256dh,
        auth
      FROM push_subscriptions
      WHERE user_id = ?
    `,
    args: [userId],
  });

  if (result.rows.length === 0) {
    console.log(
      `[Rotix Push] Nenhuma subscription encontrada para ${userId}`
    );

    return {
      sent: 0,
      failed: 0,
    };
  }

  let sent = 0;
  let failed = 0;

  const message = JSON.stringify(payload);

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
        message,
        {
          TTL: 60,
          urgency: 'high',
        }
      );

      sent++;

      console.log(
        `[Rotix Push] Notificação enviada para ${userId}`
      );
    } catch (error: any) {
      failed++;

      console.error(
        '[Rotix Push] Erro ao enviar notificação:',
        error
      );

      /*
       * 404 ou 410 normalmente significam que
       * a subscription não é mais válida.
       *
       * Removemos para evitar novas tentativas
       * contra uma assinatura morta.
       */
      if (error?.statusCode === 404 || error?.statusCode === 410) {
        await db.execute({
          sql: `
            DELETE FROM push_subscriptions
            WHERE id = ?
          `,
          args: [row.id],
        });

        console.log(
          '[Rotix Push] Subscription inválida removida.'
        );
      }
    }
  }

  return {
    sent,
    failed,
  };
}