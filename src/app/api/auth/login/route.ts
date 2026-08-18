import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyPassword } from '@/lib/auth/password';
import { createSession } from '@/lib/auth/session';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const username = String(body.username ?? '').trim();
    const password = String(body.password ?? '');

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Usuário e senha são obrigatórios.' },
        { status: 400 }
      );
    }

    const result = await db.execute({
      sql: `
        SELECT
          id,
          username,
          name,
          password_hash,
          role,
          active,
          must_change_password
        FROM users
        WHERE username = ?
        LIMIT 1
      `,
      args: [username],
    });

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Usuário ou senha inválidos.' },
        { status: 401 }
      );
    }

    const user = result.rows[0];

    if (Number(user.active) !== 1) {
      return NextResponse.json(
        { error: 'Usuário desativado.' },
        { status: 403 }
      );
    }

    const passwordValid = await verifyPassword(
      password,
      String(user.password_hash)
    );

    if (!passwordValid) {
      return NextResponse.json(
        { error: 'Usuário ou senha inválidos.' },
        { status: 401 }
      );
    }

    await createSession(String(user.id));

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        mustChangePassword: Boolean(user.must_change_password),
      },
    });
  } catch (error) {
    console.error('Erro no login:', error);

    return NextResponse.json(
      { error: 'Erro interno ao realizar login.' },
      { status: 500 }
    );
  }
}