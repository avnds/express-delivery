import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Busca todas as entregas do banco
    const result = await db.execute('SELECT * FROM deliveries ORDER BY created_at DESC');

    // Formata como texto
    let textContent = `HISTÓRICO DE ENTREGAS\n`;
    textContent += `Gerado em: ${new Date().toLocaleString('pt-BR')}\n`;
    textContent += `Total de entregas: ${result.rows.length}\n`;
    textContent += `\n${'='.repeat(80)}\n\n`;

    result.rows.forEach((delivery: any, index: number) => {
      textContent += `Entrega #${index + 1}\n`;
      textContent += `Código de Rastreio: ${delivery.tracking_code}\n`;
      textContent += `Destinatário: ${delivery.recipient_name}\n`;
      textContent += `Endereço: ${delivery.address || 'Não informado'}\n`;
      textContent += `Telefone: ${delivery.phone || 'Não informado'}\n`;
      textContent += `Status: ${delivery.status}\n`;
      textContent += `Valor da Entrega: R$ ${Number(delivery.delivery_fee || 0).toFixed(2)}\n`;
      textContent += `Observações: ${delivery.completion_notes || 'Nenhuma'}\n`;
      textContent += `Coordenadas: ${delivery.latitude ? `${delivery.latitude}, ${delivery.longitude}` : 'Não informadas'}\n`;
      textContent += `\n${'-'.repeat(80)}\n\n`;
    });

    // Retorna como arquivo para download
    return new NextResponse(textContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Content-Disposition': `attachment; filename="historico-entregas-${new Date().toISOString().slice(0, 10)}.txt"`,
      },
    });
  } catch (error) {
    console.error('Erro ao exportar histórico:', error);
    return NextResponse.json(
      { error: 'Falha ao exportar histórico' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Apaga todas as entregas do banco
    await db.execute('DELETE FROM deliveries');

    return NextResponse.json(
      { message: 'Dados operacionais apagados com sucesso' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Erro ao apagar dados:', error);
    return NextResponse.json(
      { error: 'Falha ao apagar dados' },
      { status: 500 }
    );
  }
}
