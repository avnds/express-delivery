import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const result = await db.execute('SELECT * FROM deliveries ORDER BY created_at DESC');
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar entregas:', error);
    return NextResponse.json({ error: 'Erro ao buscar entregas' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { tracking_code, recipient_name, address, latitude, longitude } = body;

    if (!tracking_code || !recipient_name) {
      return NextResponse.json(
        { error: 'Código de rastreio e destinatário são obrigatórios.' },
        { status: 400 }
      );
    }

    const id = crypto.randomUUID();

    await db.execute({
      sql: `INSERT INTO deliveries (id, tracking_code, recipient_name, address, latitude, longitude, status) 
            VALUES (?, ?, ?, ?, ?, ?, 'PENDING')`,
      args: [
        id,
        tracking_code,
        recipient_name,
        address || '',
        latitude ?? null,
        longitude ?? null,
      ],
    });

    return NextResponse.json({ message: 'Entrega criada com sucesso!', id }, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar entrega:', error);
    return NextResponse.json({ error: 'Erro ao criar entrega' }, { status: 500 });
  }
}