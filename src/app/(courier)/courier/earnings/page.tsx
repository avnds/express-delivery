'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, DollarSign, Calendar, CheckCircle2, TrendingUp, Loader2, XCircle } from 'lucide-react';
import Link from 'next/link';

interface DeliveryItem {
  id: string;
  tracking_code: string;
  status: 'PENDING' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED';
  delivery_fee?: number | null;
  created_at?: string;
}

interface EarningRecord {
  id: string;
  status: 'PENDING' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED';
  trackingCode: string;
  date: string;
  amount: number;
}

export default function EarningsPage() {
  const [earnings, setEarnings] = useState<EarningRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchEarnings() {
      try {
        const res = await fetch('/api/deliveries', { cache: 'no-store' });
        if (res.ok) {
          const data: DeliveryItem[] = await res.json();
          
          // Mantém todas que não estão pendentes (inclui DELIVERED e CANCELLED)
          const validItems = data
            .filter((item) => item.status === 'DELIVERED')
            .map((item) => {
              let formattedDate = 'Recentemente';
              if (item.created_at) {
                const dateObj = new Date(item.created_at);
                if (!isNaN(dateObj.getTime())) {
                  formattedDate = dateObj.toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                  });
                }
              }

              return {
                id: item.id,
                status: item.status,
                trackingCode: item.tracking_code,
                date: formattedDate,
                amount: Number(item.delivery_fee || 0),
              };
            });

          setEarnings(validItems);
        }
      } catch (error) {
        console.error('Erro ao carregar extrato de ganhos:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchEarnings();
  }, []);

  const totalEarnings = earnings.reduce((acc, item) => acc + item.amount, 0);

  return (
    <div className="min-h-screen bg-slate-100 pb-12">
      <div className="bg-[#002B5C] text-white p-5 sticky top-0 z-40 shadow-md">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <Link
            href="/courier"
            className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-300 text-xs font-bold flex items-center gap-1 transition"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Voltar</span>
          </Link>
          <h1 className="font-black text-sm tracking-tight">Extrato de Ganhos</h1>
          <div className="w-16" />
        </div>
      </div>

      <div className="max-w-md mx-auto p-4 space-y-4">
        {/* Card de Total Acumulado */}
        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-2xl p-6 text-white shadow-lg shadow-emerald-600/20">
          <div className="flex items-center justify-between opacity-80 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Acumulado</span>
            <TrendingUp className="h-5 w-5" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-bold">R$</span>
            <span className="text-4xl font-black tracking-tight">{totalEarnings.toFixed(2)}</span>
          </div>
          <p className="text-[11px] text-emerald-100 mt-3 pt-3 border-t border-emerald-500/40">
            Repasses atualizados após a conclusão de cada entrega.
          </p>
        </div>

        {/* Lista de Histórico */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Histórico de Corridas</h2>
            <DollarSign className="h-4 w-4 text-emerald-600" />
          </div>

          {isLoading ? (
            <div className="p-8 flex items-center justify-center text-slate-400 text-xs gap-2">
              <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
              <span>Carregando extrato...</span>
            </div>
          ) : earnings.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              Nenhuma corrida encontrada.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {earnings.map((item) => {
                const isCancelled = item.status === 'CANCELLED';
                return (
                  <div key={item.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl ${isCancelled ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                        {isCancelled ? <XCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs text-slate-800">{item.trackingCode}</span>
                          {isCancelled && (
                            <span className="text-[9px] font-bold bg-red-100 text-red-600 px-1.5 py-0.5 rounded">
                              CANCELADA
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Calendar className="h-3 w-3" />
                          <span>{item.date}</span>
                        </p>
                      </div>
                    </div>
                    <span className={`font-bold text-sm ${isCancelled ? 'text-slate-400' : 'text-emerald-600'}`}>
                      + R$ {item.amount.toFixed(2)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}