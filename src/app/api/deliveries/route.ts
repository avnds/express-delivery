import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    // Busca todas as entregas do banco
    const result = await db.execute('SELECT * FROM deliveries ORDER BY created_at DESC');
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Erro na API GET:', error);
    return NextResponse.json({ error: 'Erro ao buscar dados' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { tracking_code, recipient_name, address, latitude, longitude, phone, delivery_fee } = body;

    if (!tracking_code || !recipient_name) {
      return NextResponse.json({ error: 'Dados obrigatórios faltando' }, { status: 400 });
    }

    const id = crypto.randomUUID();
    
    // Convertendo para garantir que são números
    const fee = parseFloat(delivery_fee) || 0;

    await db.execute({
      sql: `INSERT INTO deliveries (id, tracking_code, recipient_name, phone, address, lat, lng, status, delivery_fee) 
            VALUES (?, ?, ?, ?, ?, ?, ?, 'PENDING', ?)`,
      args: [id, tracking_code, recipient_name, phone || null, address || '', latitude || null, longitude || null, fee],
    });

    return NextResponse.json({ message: 'Sucesso' }, { status: 201 });
  } catch (error) {
    console.error('Erro na API POST:', error);
    return NextResponse.json({ error: 'Erro ao salvar' }, { status: 500 });
  }
}
