import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentSession } from '@/lib/auth/session';
import { sendPushNotification } from '@/lib/push/sendPushNotification';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getCurrentSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();

    const {
      recipient_name,
      address,
      latitude,
      longitude,
      tracking_code,
      status,
      phone,
      completion_notes,
      delivery_fee,
      courier_id,
    } = body;

    const currentDelivery = await db.execute({
      sql: 'SELECT * FROM deliveries WHERE id = ?',
      args: [id],
    });

    if (currentDelivery.rows.length === 0) {
      return NextResponse.json(
        { error: 'Entrega não encontrada' },
        { status: 404 }
      );
    }

    const item = currentDelivery.rows[0];

    /*
     * ============================================================
     * FUNÇÃO AUXILIAR DE SINCRONIZAÇÃO
     * ============================================================
     *
     * DATA_CHANGED não gera notificação visual.
     *
     * O Push serve apenas para avisar a página que os dados
     * mudaram. A página então faz um GET para buscar os dados
     * oficiais do banco.
     */

    const sendDataChanged = async (
      userIds: string[]
    ) => {
      const uniqueUserIds = [
        ...new Set(
          userIds.filter(
            (userId) =>
              typeof userId === 'string' &&
              userId !== session.userId
          )
        ),
      ];

      for (const userId of uniqueUserIds) {
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
    };

    /*
     * ============================================================
     * BUSCAR USUÁRIOS ADMINISTRATIVOS PARA SINCRONIZAÇÃO
     * ============================================================
     *
     * Somente usuários ativos com perfil OPERATOR ou SUPERVISOR
     * que possuem uma subscription Push serão considerados.
     *
     * O próprio usuário que realizou a alteração será excluído
     * posteriormente pela função sendDataChanged().
     */

    const getAdminUserIds = async () => {
      const result = await db.execute({
        sql: `
          SELECT DISTINCT ps.user_id
          FROM push_subscriptions ps
          INNER JOIN users u
            ON u.id = ps.user_id
          WHERE u.active = 1
            AND u.role IN ('OPERATOR', 'SUPERVISOR')
        `,
        args: [],
      });

      return result.rows
        .map((row) => row.user_id)
        .filter(
          (userId): userId is string =>
            typeof userId === 'string'
        );
    };

    /*
     * ============================================================
     * REGRAS DO ENTREGADOR
     * ============================================================
     */

    if (session.role === 'COURIER') {

      // COLETAR:
      // A entrega precisa estar disponível.
      if (status === 'IN_TRANSIT') {
        if (item.status !== 'PENDING') {
          return NextResponse.json(
            { error: 'Esta entrega não está mais disponível.' },
            { status: 409 }
          );
        }

        // Vincula a entrega ao entregador autenticado.
        const updateResult = await db.execute({
          sql: `
            UPDATE deliveries
            SET
              status = 'IN_TRANSIT',
              courier_id = ?
            WHERE id = ?
              AND status = 'PENDING'
          `,
          args: [session.userId, id],
        });

        /*
         * Só sincronizamos os demais usuários se o UPDATE
         * realmente tiver alterado a entrega.
         */
        if (updateResult.rowsAffected > 0) {
          try {
            const adminUserIds = await getAdminUserIds();

            await sendDataChanged(adminUserIds);
          } catch (error) {
            console.error(
              '[Rotix Push] Falha ao sincronizar após coleta:',
              error
            );
          }
        }

        return NextResponse.json({
          success: true,
          message: 'Entrega coletada com sucesso.',
        });
      }

      // CONCLUIR:
      // Somente o entregador que coletou pode concluir.
      if (status === 'DELIVERED') {
        if (item.courier_id !== session.userId) {
          return NextResponse.json(
            { error: 'Esta entrega pertence a outro entregador.' },
            { status: 403 }
          );
        }

        if (item.status !== 'IN_TRANSIT') {
          return NextResponse.json(
            { error: 'A entrega não está em rota.' },
            { status: 409 }
          );
        }

        const updatedCompletionNotes =
          completion_notes !== undefined
            ? completion_notes
            : item.completion_notes;

        const updatedDeliveryFee =
          delivery_fee !== undefined
            ? delivery_fee
            : item.delivery_fee;

        const updatedCourierId =
          courier_id !== undefined
            ? courier_id
            : item.courier_id;

        const updateResult = await db.execute({
          sql: `
            UPDATE deliveries
            SET
              status = 'DELIVERED',
              completion_notes = ?,
              delivery_fee = ?
            WHERE id = ?
              AND courier_id = ?
              AND status = 'IN_TRANSIT'
          `,
          args: [
            updatedCompletionNotes,
            updatedDeliveryFee,
            id,
            session.userId,
          ],
        });

        /*
         * Só sincronizamos os demais usuários se o UPDATE
         * realmente tiver alterado a entrega.
         */
        if (updateResult.rowsAffected > 0) {
          try {
            const adminUserIds = await getAdminUserIds();

            await sendDataChanged(adminUserIds);
          } catch (error) {
            console.error(
              '[Rotix Push] Falha ao sincronizar após conclusão:',
              error
            );
          }
        }

        return NextResponse.json({
          success: true,
          message: 'Entrega concluída com sucesso.',
        });
      }

      /*
       * O entregador não pode alterar livremente:
       * nome, endereço, código, telefone etc.
       */
      return NextResponse.json(
        { error: 'Ação não permitida para entregador.' },
        { status: 403 }
      );
    }

    /*
     * ============================================================
     * OPERADOR / SUPERVISOR
     * ============================================================
     *
     * Mantemos o comportamento administrativo existente.
     */

    const updatedRecipientName =
      recipient_name ?? item.recipient_name;

    const updatedAddress =
      address ?? item.address;

    const updatedLat =
      latitude !== undefined ? latitude : item.lat;

    const updatedLng =
      longitude !== undefined ? longitude : item.lng;

    const updatedTrackingCode =
      tracking_code ?? item.tracking_code;

    const updatedStatus =
      status ?? item.status;

    const updatedPhone =
      phone !== undefined ? phone : item.phone;

    const updatedCompletionNotes =
      completion_notes !== undefined
        ? completion_notes
        : item.completion_notes;

    const updatedDeliveryFee =
      delivery_fee !== undefined
        ? delivery_fee
        : item.delivery_fee;

    const updatedCourierId =
      courier_id !== undefined
        ? courier_id
        : item.courier_id;

    const updateResult = await db.execute({
      sql: `
        UPDATE deliveries
        SET
          recipient_name = ?,
          address = ?,
          lat = ?,
          lng = ?,
          tracking_code = ?,
          status = ?,
          phone = ?,
          completion_notes = ?,
          delivery_fee = ?,
          courier_id = ?
        WHERE id = ?
      `,
      args: [
        updatedRecipientName,
        updatedAddress,
        updatedLat,
        updatedLng,
        updatedTrackingCode,
        updatedStatus,
        updatedPhone,
        updatedCompletionNotes,
        updatedDeliveryFee,
        updatedCourierId,
        id,
      ],
    });

    /*
     * ============================================================
     * SINCRONIZAÇÃO APÓS ALTERAÇÃO ADMINISTRATIVA
     * ============================================================
     *
     * O entregador antigo pode precisar atualizar sua tela.
     *
     * O novo entregador também pode precisar atualizar sua tela.
     *
     * Operadores e Supervisores também precisam saber que a
     * entrega mudou.
     *
     * O usuário que fez a alteração é excluído para evitar
     * um GET duplicado.
     */

    if (updateResult.rowsAffected > 0) {
      try {
        const adminUserIds = await getAdminUserIds();

        const courierUserIds: string[] = [];

        if (
          typeof item.courier_id === 'string' &&
          item.courier_id.trim() !== ''
        ) {
          courierUserIds.push(item.courier_id);
        }

        if (
          typeof updatedCourierId === 'string' &&
          updatedCourierId.trim() !== ''
        ) {
          courierUserIds.push(updatedCourierId);
        }

        await sendDataChanged([
          ...adminUserIds,
          ...courierUserIds,
        ]);
      } catch (error) {
        console.error(
          '[Rotix Push] Falha ao sincronizar após alteração administrativa:',
          error
        );
      }
    }

    return NextResponse.json({
      success: true,
    });

  } catch (error) {
    console.error('Erro ao atualizar entrega:', error);

    return NextResponse.json(
      { error: 'Erro interno ao atualizar entrega' },
      { status: 500 }
    );
  }
}