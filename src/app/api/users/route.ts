import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/auth/authorization';
import { hashPassword } from '@/lib/auth/password';

type UserRole = 'OPERATOR' | 'SUPERVISOR' | 'COURIER';

export async function POST(request: Request) {
  try {
    // Somente Supervisor pode cadastrar usuários
    await requireRole(['SUPERVISOR']);

    const body = await request.json();

    const username =
      typeof body.username === 'string' ? body.username.trim() : '';

    const name =
      typeof body.name === 'string' ? body.name.trim() : '';

    const password =
      typeof body.password === 'string' ? body.password : '';

    const role = body.role as UserRole;

    if (!username || !name || !password || !role) {
      return NextResponse.json(
        { error: 'Todos os campos são obrigatórios.' },
        { status: 400 }
      );
    }

    if (!['OPERATOR', 'SUPERVISOR', 'COURIER'].includes(role)) {
      return NextResponse.json(
        { error: 'Perfil de usuário inválido.' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'A senha deve possuir pelo menos 8 caracteres.' },
        { status: 400 }
      );
    }

    const existing = await db.execute({
      sql: `
        SELECT id
        FROM users
        WHERE username = ?
        LIMIT 1
      `,
      args: [username],
    });

    if (existing.rows.length > 0) {
      return NextResponse.json(
        { error: 'Nome de usuário já está em uso.' },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);
    const id = randomUUID();

    await db.execute({
      sql: `
        INSERT INTO users (
          id,
          username,
          name,
          password_hash,
          role,
          active,
          must_change_password
        )
        VALUES (?, ?, ?, ?, ?, 1, 0)
      `,
      args: [
        id,
        username,
        name,
        passwordHash,
        role,
      ],
    });

    return NextResponse.json(
      {
        success: true,
        user: {
          id,
          username,
          name,
          role,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Erro ao criar usuário:', error);

    return NextResponse.json(
      { error: 'Erro interno ao criar usuário.' },
      { status: 500 }
    );
  }
}