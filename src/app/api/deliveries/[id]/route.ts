import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { recipient_name, address, tracking_code, status } = body;

    // Busca a entrega atual para manter os dados que não forem alterados
    const currentDelivery = await db.execute({
      sql: 'SELECT * FROM deliveries WHERE id = ?',
      args: [id],
    });

    if (currentDelivery.rows.length === 0) {
      return NextResponse.json({ error: 'Entrega não encontrada' }, { status: 404 });
    }

    const item = currentDelivery.rows[0];

    const updatedRecipientName = recipient_name ?? item.recipient_name;
    const updatedAddress = address ?? item.address;
    const updatedTrackingCode = tracking_code ?? item.tracking_code;
    const updatedStatus = status ?? item.status;

    await db.execute({
      sql: `UPDATE deliveries 
            SET recipient_name = ?, address = ?, tracking_code = ?, status = ? 
            WHERE id = ?`,
      args: [updatedRecipientName, updatedAddress, updatedTrackingCode, updatedStatus, id],
    });

    return NextResponse.json({ message: 'Entrega atualizada com sucesso!' });
  } catch (error) {
    console.error('Erro ao atualizar entrega:', error);
    return NextResponse.json(
      { error: 'Erro interno ao atualizar a entrega' },
      { status: 500 }
    );
  }
}