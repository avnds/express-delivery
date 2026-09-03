import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/auth/authorization';
import { hashPassword } from '@/lib/auth/password';

type UserRole = 'OPERATOR' | 'SUPERVISOR' | 'COURIER';

export async function GET() {
  try {
    // Somente Supervisor pode visualizar os usuários
    await requireRole(['SUPERVISOR']);

    const result = await db.execute({
      sql: `
        SELECT
          id,
          username,
          name,
          role
        FROM users
        ORDER BY name ASC
      `,
      args: [],
    });

    return NextResponse.json({
      users: result.rows,
    });
  } catch (error) {
    console.error('Erro ao carregar usuários:', error);

    return NextResponse.json(
      { error: 'Erro interno ao carregar usuários.' },
      { status: 500 }
    );
  }
}

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

export async function PUT(request: Request) {
  try {
    // Somente Supervisor pode alterar usuários
    await requireRole(['SUPERVISOR']);

    const body = await request.json();

    const id =
      typeof body.id === 'string' ? body.id.trim() : '';

    const username =
      typeof body.username === 'string'
        ? body.username.trim()
        : '';

    const name =
      typeof body.name === 'string'
        ? body.name.trim()
        : '';

    const password =
      typeof body.password === 'string'
        ? body.password
        : '';

    const role = body.role as UserRole;

    if (!id || !username || !name || !role) {
      return NextResponse.json(
        { error: 'Nome, usuário e perfil são obrigatórios.' },
        { status: 400 }
      );
    }

    if (!['OPERATOR', 'SUPERVISOR', 'COURIER'].includes(role)) {
      return NextResponse.json(
        { error: 'Perfil de usuário inválido.' },
        { status: 400 }
      );
    }

    const existingUser = await db.execute({
      sql: `
        SELECT id
        FROM users
        WHERE id = ?
        LIMIT 1
      `,
      args: [id],
    });

    if (existingUser.rows.length === 0) {
      return NextResponse.json(
        { error: 'Usuário não encontrado.' },
        { status: 404 }
      );
    }

    const existingUsername = await db.execute({
      sql: `
        SELECT id
        FROM users
        WHERE username = ?
          AND id != ?
        LIMIT 1
      `,
      args: [username, id],
    });

    if (existingUsername.rows.length > 0) {
      return NextResponse.json(
        { error: 'Nome de usuário já está em uso.' },
        { status: 409 }
      );
    }

    if (password && password.length < 8) {
      return NextResponse.json(
        {
          error:
            'A senha deve possuir pelo menos 8 caracteres.',
        },
        { status: 400 }
      );
    }

    if (password) {
      const passwordHash = await hashPassword(password);

      await db.execute({
        sql: `
          UPDATE users
          SET
            username = ?,
            name = ?,
            role = ?,
            password_hash = ?,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `,
        args: [
          username,
          name,
          role,
          passwordHash,
          id,
        ],
      });
    } else {
      await db.execute({
        sql: `
          UPDATE users
          SET
            username = ?,
            name = ?,
            role = ?,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `,
        args: [
          username,
          name,
          role,
          id,
        ],
      });
    }

    const updatedUser = await db.execute({
      sql: `
        SELECT
          id,
          username,
          name,
          role
        FROM users
        WHERE id = ?
        LIMIT 1
      `,
      args: [id],
    });

    return NextResponse.json({
      success: true,
      user: updatedUser.rows[0],
    });
  } catch (error) {
    console.error('Erro ao alterar usuário:', error);

    return NextResponse.json(
      { error: 'Erro interno ao alterar usuário.' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    // Somente Supervisor pode excluir usuários
    await requireRole(['SUPERVISOR']);

    const body = await request.json();

    const id =
      typeof body.id === 'string' ? body.id.trim() : '';

    if (!id) {
      return NextResponse.json(
        { error: 'ID do usuário é obrigatório.' },
        { status: 400 }
      );
    }

    const existing = await db.execute({
      sql: `
        SELECT id, role
        FROM users
        WHERE id = ?
        LIMIT 1
      `,
      args: [id],
    });

    if (existing.rows.length === 0) {
      return NextResponse.json(
        { error: 'Usuário não encontrado.' },
        { status: 404 }
      );
    }

    const user = existing.rows[0];

    // Supervisor não pode ser excluído
    if (user.role === 'SUPERVISOR') {
      return NextResponse.json(
        {
          error:
            'Usuários com perfil Supervisor não podem ser excluídos.',
        },
        { status: 403 }
      );
    }

    await db.execute({
      sql: `
        DELETE FROM users
        WHERE id = ?
      `,
      args: [id],
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error('Erro ao excluir usuário:', error);

    return NextResponse.json(
      { error: 'Erro interno ao excluir usuário.' },
      { status: 500 }
    );
  }
}