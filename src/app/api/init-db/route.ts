import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS deliveries (
        id TEXT PRIMARY KEY,
        tracking_code TEXT NOT NULL,
        recipient_name TEXT NOT NULL,
        address TEXT NOT NULL,
        lat REAL,
        lng REAL,
        status TEXT DEFAULT 'PENDING',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
    return NextResponse.json({ message: 'Tabela deliveries criada com sucesso!' });
  } catch (error) {
    console.error('Erro ao criar tabela:', error);
    return NextResponse.json({ error: 'Erro ao criar tabela' }, { status: 500 });
  }
}