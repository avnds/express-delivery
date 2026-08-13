'use client';

import { useState, useEffect, useCallback } from 'react';
import { Shield, Loader2 } from 'lucide-react';

interface DeliveryItem {
  id: string;
  tracking_code: string;
  recipient_name: string;
  status: 'PENDING' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED';
}

export default function SupervisorPage() {
  const [deliveries, setDeliveries] = useState<DeliveryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDeliveries = useCallback(async (isSilent = false) => {
    if (!isSilent) setIsLoading(true);
    try {
      const res = await fetch('/api/deliveries', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setDeliveries(data);
      }
    } catch (error) {
      console.error('Erro ao carregar entregas no supervisor:', error);
    } finally {
      if (!isSilent) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDeliveries();

    // Polling a cada 4 segundos no painel do supervisor
    const interval = setInterval(() => {
      fetchDeliveries(true);
    }, 4000);

    return () => clearInterval(interval);
  }, [fetchDeliveries]);

  const handleOverrideStatus = async (id: string, newStatus: DeliveryItem['status']) => {
    try {
      const res = await fetch(`/api/deliveries/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        fetchDeliveries(true);
      } else {
        alert('Erro ao atualizar no servidor.');
      }
    } catch {
      alert('Erro de conexão ao alterar o status.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-600 text-white rounded-2xl shadow-md shadow-red-600/20">
              <Shield className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Painel do Supervisor</h1>
              <p className="text-xs text-slate-500">Monitoramento global e alteração manual de status (Override)</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 font-bold text-xs text-slate-700 uppercase tracking-wider">
            Gerenciamento de Ordens Ativas
          </div>

          {isLoading ? (
            <div className="p-8 flex items-center justify-center text-slate-400 text-xs gap-2">
              <Loader2 className="h-5 w-5 animate-spin text-red-600" />
              <span>Carregando dados do banco...</span>
            </div>
          ) : deliveries.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">Nenhuma ordem encontrada no banco.</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {deliveries.map((item) => (
                <div key={item.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs bg-slate-100 text-slate-800 px-2 py-0.5 rounded">
                        {item.tracking_code}
                      </span>
                      <span className="text-xs font-bold text-slate-900">{item.recipient_name}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-slate-500">
                      Status atual: <strong className="text-indigo-600">{item.status}</strong>
                    </span>

                    <select
                      value={item.status}
                      onChange={(e) => handleOverrideStatus(item.id, e.target.value as DeliveryItem['status'])}
                      className="text-xs border border-slate-300 rounded-xl px-3 py-1.5 bg-slate-50 font-medium text-slate-700 outline-none focus:ring-2 focus:ring-red-600"
                    >
                      <option value="PENDING">PENDING</option>
                      <option value="IN_TRANSIT">IN_TRANSIT</option>
                      <option value="DELIVERED">DELIVERED</option>
                      <option value="CANCELLED">CANCELLED</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}