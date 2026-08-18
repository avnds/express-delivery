import { NextResponse } from 'next/server';
import { destroySession } from '@/lib/auth/session';

export async function POST() {
  try {
    await destroySession();

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error('Erro no logout:', error);

    return NextResponse.json(
      { error: 'Erro interno ao realizar logout.' },
      { status: 500 }
    );
  }
}