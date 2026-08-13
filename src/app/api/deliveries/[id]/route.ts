import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { recipient_name, address, latitude, longitude, tracking_code, status, phone } = body;

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
    
    // Se latitude/longitude vierem explicitamente como null, salvamos null. 
    // Se vierem undefined (não enviados, como em alteração rápida de status), mantemos o atual.
    const updatedLat = latitude !== undefined ? latitude : item.lat;
    const updatedLng = longitude !== undefined ? longitude : item.lng;

    const updatedTrackingCode = tracking_code ?? item.tracking_code;
    const updatedStatus = status ?? item.status;
    const updatedPhone = phone !== undefined ? phone : item.phone;

    await db.execute({
      sql: `UPDATE deliveries 
            SET recipient_name = ?, address = ?, lat = ?, lng = ?, tracking_code = ?, status = ?, phone = ? 
            WHERE id = ?`,
      args: [
        updatedRecipientName, 
        updatedAddress, 
        updatedLat, 
        updatedLng, 
        updatedTrackingCode, 
        updatedStatus, 
        updatedPhone,
        id
      ],
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao atualizar entrega:', error);
    return NextResponse.json({ error: 'Erro interno ao atualizar entrega' }, { status: 500 });
  }
}