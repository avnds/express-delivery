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

    // Tratamento estrito de tipo para o Turso
    const safeLat = typeof latitude === 'number' && !isNaN(latitude) ? latitude : null;
    const safeLng = typeof longitude === 'number' && !isNaN(longitude) ? longitude : null;
    const safeAddress = address || '';

    // Mapeado exatamente para as colunas 'lat' e 'lng' do seu schema
    await db.execute({
      sql: `INSERT INTO deliveries (id, tracking_code, recipient_name, address, lat, lng, status) 
            VALUES (?, ?, ?, ?, ?, ?, 'PENDING')`,
      args: [id, tracking_code, recipient_name, safeAddress, safeLat, safeLng],
    });

    return NextResponse.json({ message: 'Entrega criada com sucesso!', id }, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar entrega:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro interno';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}