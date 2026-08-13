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
    // 1. Adicionamos o 'phone' na desestruturação do corpo da requisição
    const { tracking_code, recipient_name, address, latitude, longitude, phone } = body;

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
    const safePhone = phone || null; // 2. Tratamento seguro para o telefone

    // 3. Incluímos a coluna 'phone' no SQL e o 'safePhone' nos argumentos
    await db.execute({
      sql: `INSERT INTO deliveries (id, tracking_code, recipient_name, phone, address, lat, lng, status) 
            VALUES (?, ?, ?, ?, ?, ?, ?, 'PENDING')`,
      args: [id, tracking_code, recipient_name, safePhone, safeAddress, safeLat, safeLng],
    });

    return NextResponse.json({ message: 'Entrega criada com sucesso!', id }, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar entrega:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro interno';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}