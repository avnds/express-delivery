import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    if (!status) {
      return NextResponse.json(
        { error: 'O campo status é obrigatório' },
        { status: 400 }
      );
    }

    // Atualiza o status da entrega no banco de dados Turso
    await db.execute({
      sql: 'UPDATE deliveries SET status = ? WHERE id = ?',
      args: [status, id],
    });

    return NextResponse.json({ message: 'Status atualizado com sucesso!' });
  } catch (error) {
    console.error('Erro ao atualizar entrega:', error);
    return NextResponse.json(
      { error: 'Erro interno ao atualizar a entrega' },
      { status: 500 }
    );
  }
}