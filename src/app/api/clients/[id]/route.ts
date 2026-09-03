import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PUT(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const name =
      typeof body.name === 'string'
        ? body.name.trim()
        : '';

    const address =
      typeof body.address === 'string'
        ? body.address.trim()
        : '';

    const phone =
      typeof body.phone === 'string'
        ? body.phone.replace(/\D/g, '')
        : '';

    if (!id || !name || !phone || !address) {
      return NextResponse.json(
        {
          error:
            'Nome, telefone e endereço são obrigatórios.',
        },
        { status: 400 }
      );
    }

    const existingClient = await db.execute({
      sql: `
        SELECT id
        FROM clients
        WHERE phone = ?
          AND id != ?
        LIMIT 1
      `,
      args: [phone, id],
    });

    if (existingClient.rows.length > 0) {
      return NextResponse.json(
        {
          error:
            'Já existe um cliente cadastrado com este telefone.',
        },
        { status: 409 }
      );
    }

    const result = await db.execute({
      sql: `
        UPDATE clients
        SET
          phone = ?,
          name = ?,
          address = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `,
      args: [phone, name, address, id],
    });

    if (result.rowsAffected === 0) {
      return NextResponse.json(
        {
          error: 'Cliente não encontrado.',
        },
        { status: 404 }
      );
    }

    const updatedClient = await db.execute({
      sql: `
        SELECT
          id,
          phone,
          name,
          address,
          created_at,
          updated_at
        FROM clients
        WHERE id = ?
        LIMIT 1
      `,
      args: [id],
    });

    return NextResponse.json({
      client: updatedClient.rows[0],
    });
  } catch (error) {
    console.error(
      'Erro ao alterar cliente:',
      error
    );

    return NextResponse.json(
      {
        error: 'Erro interno ao alterar cliente.',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: RouteContext
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        {
          error: 'ID do cliente é obrigatório.',
        },
        { status: 400 }
      );
    }

    const result = await db.execute({
      sql: `
        DELETE FROM clients
        WHERE id = ?
      `,
      args: [id],
    });

    if (result.rowsAffected === 0) {
      return NextResponse.json(
        {
          error: 'Cliente não encontrado.',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error(
      'Erro ao excluir cliente:',
      error
    );

    return NextResponse.json(
      {
        error: 'Erro interno ao excluir cliente.',
      },
      { status: 500 }
    );
  }
}