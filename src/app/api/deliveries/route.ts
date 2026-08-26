import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentSession } from '@/lib/auth/session';

export async function GET() {
  try {
    const session = await getCurrentSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }

    let result;

    if (session.role === 'COURIER') {
      result = await db.execute({
        sql: `
          SELECT
            d.*,
            u.name AS courier_name
          FROM deliveries d
          LEFT JOIN users u
            ON u.id = d.courier_id
          WHERE
            d.status = 'PENDING'
            OR (
              d.status = 'IN_TRANSIT'
              AND d.courier_id = ?
            )
          ORDER BY d.created_at DESC
        `,
        args: [session.userId],
      });
    } else {
      result = await db.execute({
        sql: `
          SELECT
            d.*,
            u.name AS courier_name
          FROM deliveries d
          LEFT JOIN users u
            ON u.id = d.courier_id
          ORDER BY d.created_at DESC
        `,
        args: [],
      });
    }

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Erro na API GET:', error);

    return NextResponse.json(
      { error: 'Erro ao buscar dados' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      tracking_code,
      recipient_name,
      address,
      latitude,
      longitude,
      phone,
      delivery_fee,
      courier_id,
    } = body;

    if (!tracking_code || !recipient_name) {
      return NextResponse.json(
        { error: 'Dados obrigatórios faltando' },
        { status: 400 }
      );
    }

    // Entregador é opcional.
    // Se vier vazio, a entrega ficará disponível para qualquer entregador.
    const courierId =
      typeof courier_id === 'string' && courier_id.trim() !== ''
        ? courier_id.trim()
        : null;

    // Se foi informado um entregador, verifica se ele existe,
    // está ativo e realmente possui o perfil COURIER.
    if (courierId) {
      const courier = await db.execute({
        sql: `
          SELECT id
          FROM users
          WHERE id = ?
            AND role = 'COURIER'
            AND active = 1
          LIMIT 1
        `,
        args: [courierId],
      });

      if (courier.rows.length === 0) {
        return NextResponse.json(
          { error: 'Entregador selecionado não é válido ou está inativo.' },
          { status: 400 }
        );
      }
    }

    const id = crypto.randomUUID();

    const fee = parseFloat(delivery_fee) || 0;

    await db.execute({
      sql: `
        INSERT INTO deliveries (
          id,
          tracking_code,
          recipient_name,
          phone,
          address,
          lat,
          lng,
          status,
          delivery_fee,
          courier_id
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, 'PENDING', ?, ?)
      `,
      args: [
        id,
        tracking_code,
        recipient_name,
        phone || null,
        address || '',
        latitude ?? null,
        longitude ?? null,
        fee,
        courierId,
      ],
    });

    return NextResponse.json(
      {
        message: 'Sucesso',
        delivery: {
          id,
          tracking_code,
          courier_id: courierId,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Erro na API POST:', error);

    return NextResponse.json(
      { error: 'Erro ao salvar' },
      { status: 500 }
    );
  }
}