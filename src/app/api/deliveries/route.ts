import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET: Listar todas as entregas
export async function GET() {
  try {
    const result = await db.execute('SELECT * FROM deliveries ORDER BY created_at DESC');
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar entregas:', error);
    return NextResponse.json({ error: 'Erro ao carregar entregas' }, { status: 500 });
  }
}

// POST: Criar nova entrega (Operador)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { recipientName, address, lat, lng } = body;

    if (!recipientName || !address) {
      return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 });
    }

    const id = crypto.randomUUID();
    const trackingCode = `#EX-${Math.floor(1000 + Math.random() * 9000)}`;

    await db.execute({
      sql: `INSERT INTO deliveries (id, tracking_code, recipient_name, address, lat, lng, status) 
            VALUES (?, ?, ?, ?, ?, ?, 'PENDING')`,
      args: [id, trackingCode, recipientName, address, lat || null, lng || null],
    });

    return NextResponse.json({ message: 'Entrega criada com sucesso!', id, trackingCode }, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar entrega:', error);
    return NextResponse.json({ error: 'Erro ao salvar no banco' }, { status: 500 });
  }
}