'use client';

import { useState } from 'react';
import { ArrowLeft, DollarSign, Calendar, CheckCircle2, TrendingUp } from 'lucide-react';
import Link from 'next/link';

interface EarningRecord {
  id: string;
  trackingCode: string;
  date: string;
  amount: number;
}

export default function EarningsPage() {
  const [earnings] = useState<EarningRecord[]>([
    { id: '1', trackingCode: '#EX-9010', date: 'Hoje, 14:30', amount: 12.50 },
    { id: '2', trackingCode: '#EX-9008', date: 'Hoje, 11:15', amount: 15.00 },
    { id: '3', trackingCode: '#EX-8995', date: 'Ontem, 18:40', amount: 10.00 },
    { id: '4', trackingCode: '#EX-8990', date: 'Ontem, 16:20', amount: 18.50 },
  ]);

  const totalEarnings = earnings.reduce((acc, item) => acc + item.amount, 0);

  return (
    <div className="min-h-screen bg-slate-100 pb-12">
      <div className="bg-slate-900 text-white p-5 sticky top-0 z-40 shadow-md">
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

        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Histórico de Corridas</h2>
            <DollarSign className="h-4 w-4 text-emerald-600" />
          </div>

          <div className="divide-y divide-slate-100">
            {earnings.map((item) => (
              <div key={item.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="font-mono font-bold text-xs text-slate-800">{item.trackingCode}</span>
                    <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                      <Calendar className="h-3 w-3" />
                      <span>{item.date}</span>
                    </p>
                  </div>
                </div>
                <span className="font-bold text-sm text-emerald-600">
                  + R$ {item.amount.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}