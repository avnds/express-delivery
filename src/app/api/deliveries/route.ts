import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentSession } from '@/lib/auth/session';
import { sendPushNotification } from '@/lib/push/sendPushNotification';

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

    const from = searchParams.get('from');
    const to = searchParams.get('to');

    let dateFilter = '';
    const dateArgs: string[] = [];

    /*
     * O SQLite armazena CURRENT_TIMESTAMP em UTC.
     *
     * Para o sistema Rotix, consideramos UTC-3.
     *
     * Exemplo:
     * Banco: 2026-08-28 02:00:00 UTC
     * Brasil: 2026-08-27 23:00:00
     */

    if (from) {
      dateFilter += `
    AND d.created_at >= datetime(?, '+3 hours')
  `;

      dateArgs.push(`${from} 00:00:00`);
    }

    if (to) {
      dateFilter += `
    AND d.created_at < datetime(?, '+1 day', '+3 hours')
  `;

      dateArgs.push(`${to} 00:00:00`);
    }

    let result;

    /*
     * ENTREGADOR
     *
     * Mantemos a regra atual:
     * - PENDING sem entregador ou dele
     * - IN_TRANSIT somente dele
     *
     * O filtro de período não é aplicado aqui.
     */
    if (session.role === 'COURIER') {
      result = await db.execute({
        sql: `
          SELECT
            d.*,
            u.name AS courier_name
          FROM deliveries d
          LEFT JOIN users u
            ON u.id = d.courier_id
          WHERE
            (
              d.status = 'PENDING'
              AND (
                d.courier_id IS NULL
                OR d.courier_id = ?
              )
            )
            OR (
              d.status = 'IN_TRANSIT'
              AND d.courier_id = ?
            )
          ORDER BY d.created_at DESC
        `,
        args: [session.userId, session.userId],
      });
    } else {
      /*
       * OPERADOR / SUPERVISOR
       *
       * Aqui aplicamos o filtro de período.
       */
      result = await db.execute({
        sql: `
          SELECT
            d.*,
            u.name AS courier_name
          FROM deliveries d
          LEFT JOIN users u
            ON u.id = d.courier_id
          WHERE 1 = 1
          ${dateFilter}
          ORDER BY d.created_at DESC
        `,
        args: dateArgs,
      });
    }

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Erro na API GET:', error);

    return NextResponse.json(
      { error: 'Erro ao buscar dados' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getCurrentSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }

    const body = await request.json();

    const {
      tracking_code,
      recipient_name,
      address,
      latitude,
      longitude,
      phone,
      delivery_fee,
      courier_id,
    } = body;

    if (!tracking_code || !recipient_name) {
      return NextResponse.json(
        { error: 'Dados obrigatórios faltando' },
        { status: 400 }
      );
    }

    const courierId =
      typeof courier_id === 'string' && courier_id.trim() !== ''
        ? courier_id.trim()
        : null;

    if (courierId) {
      const courier = await db.execute({
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

      if (courier.rows.length === 0) {
        return NextResponse.json(
          {
            error:
              'Entregador selecionado não é válido ou está inativo.',
          },
          { status: 400 }
        );
      }
    }

    const id = crypto.randomUUID();

    const fee = parseFloat(delivery_fee) || 0;

    // Normaliza o telefone para salvar somente números.
    const normalizedPhone =
      typeof phone === 'string'
        ? phone.replace(/\D/g, '')
        : '';

    await db.execute({
      sql: `
        INSERT INTO deliveries (
          id,
          tracking_code,
          recipient_name,
          phone,
          address,
          lat,
          lng,
          status,
          delivery_fee,
          courier_id
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, 'PENDING', ?, ?)
      `,
      args: [
        id,
        tracking_code,
        recipient_name,
        normalizedPhone || null,
        address || '',
        latitude ?? null,
        longitude ?? null,
        fee,
        courierId,
      ],
    });

    /*
 * CLIENTE
 *
 * Se houver telefone, verificamos se o cliente já existe.
 * Caso não exista, cadastramos automaticamente.
 *
 * Não existe FK entre clients e deliveries.
 * A entrega mantém sua própria cópia dos dados.
 */
    if (normalizedPhone) {
      const existingClient = await db.execute({
        sql: `
          SELECT id
          FROM clients
          WHERE phone = ?
          LIMIT 1
        `,
        args: [normalizedPhone],
      });

      if (existingClient.rows.length === 0) {
        const clientId = crypto.randomUUID();

        await db.execute({
          sql: `
            INSERT INTO clients (
              id,
              phone,
              name,
              address
            )
            VALUES (?, ?, ?, ?)
          `,
          args: [
            clientId,
            normalizedPhone,
            recipient_name.trim(),
            (address || '').trim(),
          ],
        });
      }
    }

    /*
     * NOVA ENTREGA
     *
     * Se houver entregador definido, enviamos um evento
     * NEW_DELIVERY para ele.
     *
     * O Service Worker:
     * - mostra a notificação visual;
     * - avisa a página para sincronizar.
     */
    if (courierId) {
      try {
        await sendPushNotification(courierId, {
          type: 'NEW_DELIVERY',
          title: '🔔 Nova entrega disponível',
          body: `Entrega ${tracking_code} disponível para você.`,
          url: '/courier',
          deliveryId: id,
        });
      } catch (error) {
        console.error(
          '[Rotix Push] Falha ao enviar notificação da nova entrega:',
          error
        );
      }
    }

    /*
     * SINCRONIZAÇÃO DOS USUÁRIOS ADMINISTRATIVOS
     *
     * Operadores e Supervisores que possuem Push ativo
     * precisam atualizar suas listas.
     *
     * O usuário que criou a entrega é excluído porque
     * a própria tela já faz um GET após o POST.
     */
    try {
      const adminSubscriptions = await db.execute({
        sql: `
          SELECT DISTINCT ps.user_id
          FROM push_subscriptions ps
          INNER JOIN users u
            ON u.id = ps.user_id
          WHERE u.active = 1
            AND u.role IN ('OPERATOR', 'SUPERVISOR')
            AND ps.user_id != ?
        `,
        args: [session.userId],
      });

      for (const row of adminSubscriptions.rows) {
        const userId = row.user_id;

        if (typeof userId !== 'string') {
          continue;
        }

        try {
          await sendPushNotification(userId, {
            type: 'DATA_CHANGED',
            title: '',
            body: '',
            deliveryId: id,
          });
        } catch (error) {
          console.error(
            `[Rotix Push] Falha ao sincronizar usuário ${userId}:`,
            error
          );
        }
      }
    } catch (error) {
      console.error(
        '[Rotix Push] Falha ao buscar usuários para sincronização:',
        error
      );
    }

    return NextResponse.json(
      {
        message: 'Sucesso',
        delivery: {
          id,
          tracking_code,
          courier_id: courierId,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Erro na API POST:', error);

    return NextResponse.json(
      { error: 'Erro ao salvar' },
      { status: 500 }
    );
  }
}