'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  ArrowLeft,
  DollarSign,
  Calendar,
  CheckCircle2,
  TrendingUp,
  Loader2,
  XCircle,
} from 'lucide-react';
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

  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo, setFilterTo] = useState('');
  const [activeQuickFilter, setActiveQuickFilter] = useState('today');

  const applyQuickFilter = (filter: string) => {
    const today = new Date();

    const formatDate = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');

      return `${year}-${month}-${day}`;
    };

    const todayFormatted = formatDate(today);

    if (filter === 'today') {
      setFilterFrom(todayFormatted);
      setFilterTo(todayFormatted);
    }

    if (filter === 'yesterday') {
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);

      const yesterdayFormatted = formatDate(yesterday);

      setFilterFrom(yesterdayFormatted);
      setFilterTo(yesterdayFormatted);
    }

    if (filter === 'last7') {
      const startDate = new Date(today);
      startDate.setDate(today.getDate() - 6);

      setFilterFrom(formatDate(startDate));
      setFilterTo(todayFormatted);
    }

    if (filter === 'month') {
      const startOfMonth = new Date(
        today.getFullYear(),
        today.getMonth(),
        1
      );

      setFilterFrom(formatDate(startOfMonth));
      setFilterTo(todayFormatted);
    }

    if (filter === 'all') {
      setFilterFrom('');
      setFilterTo('');
    }

    setActiveQuickFilter(filter);
  };

  const fetchEarnings = useCallback(async () => {
    try {
      setIsLoading(true);

      const params = new URLSearchParams();

      if (filterFrom) {
        params.set('from', filterFrom);
      }

      if (filterTo) {
        params.set('to', filterTo);
      }

      const query = params.toString();

      const res = await fetch(
        `/api/courier/earnings${query ? `?${query}` : ''}`,
        {
          cache: 'no-store',
        }
      );

      if (res.ok) {
        const data: DeliveryItem[] = await res.json();

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
      console.error(
        'Erro ao carregar extrato de ganhos:',
        error
      );
    } finally {
      setIsLoading(false);
    }
  }, [filterFrom, filterTo]);

  useEffect(() => {
    applyQuickFilter('today');
  }, []);

  useEffect(() => {
    fetchEarnings();
  }, [fetchEarnings]);

  const totalEarnings = earnings.reduce(
    (acc, item) => acc + item.amount,
    0
  );

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

          <h1 className="font-black text-sm tracking-tight">
            Extrato de Ganhos
          </h1>

          <div className="w-16" />
        </div>
      </div>

      <div className="max-w-md mx-auto p-4 space-y-4">

        {/* Card de Total Acumulado */}
        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-2xl p-6 text-white shadow-lg shadow-emerald-600/20">
          <div className="flex items-center justify-between opacity-80 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">
              Total Acumulado
            </span>

            <TrendingUp className="h-5 w-5" />
          </div>

          <div className="flex items-baseline gap-1">
            <span className="text-lg font-bold">R$</span>

            <span className="text-4xl font-black tracking-tight">
              {totalEarnings.toFixed(2)}
            </span>
          </div>

          <p className="text-[11px] text-emerald-100 mt-3 pt-3 border-t border-emerald-500/40">
            Repasses atualizados após a conclusão de cada entrega.
          </p>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4">
          <div className="flex flex-col gap-3">

            {/* Filtros rápidos */}
            <div className="flex flex-wrap gap-2">

              <button
                type="button"
                onClick={() => applyQuickFilter('today')}
                className={`px-3 py-2 text-xs font-semibold rounded-lg transition ${
                  activeQuickFilter === 'today'
                    ? 'bg-[#002B5C] text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Hoje
              </button>

              <button
                type="button"
                onClick={() => applyQuickFilter('yesterday')}
                className={`px-3 py-2 text-xs font-semibold rounded-lg transition ${
                  activeQuickFilter === 'yesterday'
                    ? 'bg-[#002B5C] text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Ontem
              </button>

              <button
                type="button"
                onClick={() => applyQuickFilter('last7')}
                className={`px-3 py-2 text-xs font-semibold rounded-lg transition ${
                  activeQuickFilter === 'last7'
                    ? 'bg-[#002B5C] text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Últimos 7 dias
              </button>

              <button
                type="button"
                onClick={() => applyQuickFilter('month')}
                className={`px-3 py-2 text-xs font-semibold rounded-lg transition ${
                  activeQuickFilter === 'month'
                    ? 'bg-[#002B5C] text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Este mês
              </button>

              <button
                type="button"
                onClick={() => applyQuickFilter('all')}
                className={`px-3 py-2 text-xs font-semibold rounded-lg transition ${
                  activeQuickFilter === 'all'
                    ? 'bg-[#002B5C] text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Todos
              </button>

            </div>

            {/* Datas manuais */}
            <div className="flex flex-col gap-2">

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                  Data inicial
                </label>

                <input
                  type="date"
                  value={filterFrom}
                  onChange={(e) => {
                    setFilterFrom(e.target.value);
                    setActiveQuickFilter('');
                  }}
                  className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#FF6600]/30 focus:border-[#FF6600]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                  Data final
                </label>

                <input
                  type="date"
                  value={filterTo}
                  onChange={(e) => {
                    setFilterTo(e.target.value);
                    setActiveQuickFilter('');
                  }}
                  className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#FF6600]/30 focus:border-[#FF6600]"
                />
              </div>

              <button
                type="button"
                onClick={() => {
                  setFilterFrom('');
                  setFilterTo('');
                  setActiveQuickFilter('all');
                }}
                className="h-[34px] px-3 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
              >
                Limpar
              </button>

            </div>

          </div>
        </div>

        {/* Lista de Histórico */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">

          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
              Histórico de Corridas
            </h2>

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
                  <div
                    key={item.id}
                    className="p-4 flex items-center justify-between hover:bg-slate-50 transition"
                  >
                    <div className="flex items-center gap-3">

                      <div
                        className={`p-2 rounded-xl ${
                          isCancelled
                            ? 'bg-red-50 text-red-600'
                            : 'bg-emerald-50 text-emerald-600'
                        }`}
                      >
                        {isCancelled ? (
                          <XCircle className="h-4 w-4" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4" />
                        )}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">

                          <span className="font-mono font-bold text-xs text-slate-800">
                            {item.trackingCode}
                          </span>

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

                    <span
                      className={`font-bold text-sm ${
                        isCancelled
                          ? 'text-slate-400'
                          : 'text-emerald-600'
                      }`}
                    >
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