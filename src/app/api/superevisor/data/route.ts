import { NextResponse } from 'next/server';
import { db } from '@/db'; // Ajuste conforme o caminho real da sua conexão/db
import { deliveries } from '@/db/schema'; // Ajuste conforme o caminho real do seu schema

// GET: Exporta todo o histórico em formato texto (.txt)
export async function GET() {
  try {
    const allDeliveries = await db.select().from(deliveries);

    let textContent = '=== HISTÓRICO DE ENTREGAS E OPERAÇÕES ===\n\n';
    
    allDeliveries.forEach((d: any, index: number) => {
      textContent += `[${index + 1}] Código: ${d.trackingCode || d.tracking_code}\n`;
      textContent += `Destinatário: ${d.recipientName || d.recipient_name}\n`;
      textContent += `Endereço: ${d.address}\n`;
      textContent += `Status: ${d.status}\n`;
      textContent += `Telefone: ${d.phone || 'N/A'}\n`;
      textContent += `Observações: ${d.completionNotes || d.completion_notes || 'N/A'}\n`;
      textContent += `Valor da Taxa: R$ ${Number(d.deliveryFee || d.delivery_fee || 0).toFixed(2)}\n`;
      textContent += `Data de Criação: ${d.createdAt || d.created_at || 'N/A'}\n`;
      textContent += `----------------------------------------\n\n`;
    });

    return new NextResponse(textContent, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Content-Disposition': 'attachment; filename="historico-entregas.txt"',
      },
    });
  } catch (error) {
    console.error('Erro ao exportar histórico:', error);
    return NextResponse.json({ error: 'Erro ao gerar arquivo de histórico.' }, { status: 500 });
  }
}

// DELETE: Apaga todos os dados operacionais das entregas
export async function DELETE() {
  try {
    await db.delete(deliveries);
    return NextResponse.json({ success: true, message: 'Dados operacionais apagados com sucesso.' });
  } catch (error) {
    console.error('Erro ao limpar dados:', error);
    return NextResponse.json({ error: 'Erro ao limpar dados operacionais.' }, { status: 500 });
  }
}