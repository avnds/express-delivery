import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentSession } from '@/lib/auth/session';

export async function GET(request: Request) {
    try {
        const session = await getCurrentSession();

        if (!session) {
            return NextResponse.json(
                { error: 'Não autenticado' },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(request.url);
        const phone = (searchParams.get('phone') || '').replace(/\D/g, '');

        if (!phone) {
            return NextResponse.json(
                { error: 'Informe o telefone.' },
                { status: 400 }
            );
        }

        const result = await db.execute({
            sql: `
        SELECT
          id,
          phone,
          name,
          address,
          created_at,
          updated_at
        FROM clients
        WHERE phone = ?
        LIMIT 1
      `,
            args: [phone],
        });

        if (result.rows.length === 0) {
            return NextResponse.json({
                client: null,
            });
        }

        return NextResponse.json({
            client: result.rows[0],
        });
    } catch (error) {
        console.error('Erro na API GET /api/clients:', error);

        return NextResponse.json(
            { error: 'Erro ao buscar cliente.' },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const session = await getCurrentSession();

        if (!session) {
            return NextResponse.json(
                { error: 'Não autenticado' },
                { status: 401 }
            );
        }

        const body = await request.json();

        const phone =
            typeof body.phone === 'string'
                ? body.phone.replace(/\D/g, '')
                : '';

        const name =
            typeof body.name === 'string'
                ? body.name.trim()
                : '';

        const address =
            typeof body.address === 'string'
                ? body.address.trim()
                : '';

        if (!phone || !name || !address) {
            return NextResponse.json(
                {
                    error:
                        'Telefone, nome e endereço são obrigatórios.',
                },
                { status: 400 }
            );
        }

        const existingClient = await db.execute({
            sql: `
        SELECT id
        FROM clients
        WHERE phone = ?
        LIMIT 1
      `,
            args: [phone],
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

        const id = crypto.randomUUID();

        await db.execute({
            sql: `
        INSERT INTO clients (
          id,
          phone,
          name,
          address
        )
        VALUES (?, ?, ?, ?)
      `,
            args: [
                id,
                phone,
                name,
                address,
            ],
        });

        return NextResponse.json(
            {
                message: 'Cliente cadastrado com sucesso.',
                client: {
                    id,
                    phone,
                    name,
                    address,
                },
            },
            { status: 201 }
        );
    } catch (error) {
        console.error(
            'Erro na API POST /api/clients:',
            error
        );

        return NextResponse.json(
            { error: 'Erro ao cadastrar cliente.' },
            { status: 500 }
        );
    }
}