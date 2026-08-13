'use client';

import { useState, useEffect, useCallback } from 'react';
import { CourierDeliveryCard } from '@/components/courier/CourierDeliveryCard';
import { Truck, DollarSign, Loader2 } from 'lucide-react';

interface Delivery {
  id: string;
  tracking_code: string;
  recipient_name: string;
  address: string;
  lat?: number | string;
  lng?: number | string;
  status: 'PENDING' | 'IN_TRANSIT' | 'DELIVERED';
  phone?: string | null; // Adicionado o campo phone
}

export default function CourierPage() {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDeliveries = useCallback(async (isSilent = false) => {
    if (!isSilent) setIsLoading(true);
    try {
      const res = await fetch('/api/deliveries', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setDeliveries(data.filter((d: Delivery) => d.status !== 'DELIVERED' && d.status !== ('CANCELLED' as any)));
      }
    } catch (error) {
      console.error('Erro ao carregar entregas do entregador:', error);
    } finally {
      if (!isSilent) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Busca inicial
    fetchDeliveries();

    // Polling: Atualiza silenciosamente a cada 4 segundos
    const interval = setInterval(() => {
      fetchDeliveries(true);
    }, 4000);

    return () => clearInterval(interval);
  }, [fetchDeliveries]);

  const handleUpdateStatus = async (id: string, newStatus: 'IN_TRANSIT' | 'DELIVERED') => {
    try {
      const res = await fetch(`/api/deliveries/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        fetchDeliveries(true);
      } else {
        alert('Falha ao atualizar o status.');
      }
    } catch {
      alert('Erro de rede ao atualizar status.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 pb-12">
      <div className="bg-slate-900 text-white p-5 sticky top-0 z-40 shadow-md">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-600 rounded-xl">
              <Truck className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="font-black text-sm tracking-tight">Fila de Entregas</h1>
              <p className="text-[10px] text-slate-400">Visão do Entregador</p>
            </div>
          </div>

          <a
            href="/courier/earnings"
            className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-emerald-400 text-xs font-bold flex items-center gap-1 transition"
          >
            <DollarSign className="h-4 w-4" />
            <span>Ganhos</span>
          </a>
        </div>
      </div>

      <div className="max-w-md mx-auto p-4 space-y-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-8 text-slate-400 text-xs gap-2">
            <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
            <span>Buscando entregas disponíveis...</span>
          </div>
        ) : deliveries.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl text-center text-slate-400 text-xs font-medium border border-slate-200">
            Nenhuma entrega pendente na sua fila!
          </div>
        ) : (
          deliveries.map((delivery) => (
            <CourierDeliveryCard
              key={delivery.id}
              id={delivery.id}
              trackingCode={delivery.tracking_code}
              recipientName={delivery.recipient_name}
              address={delivery.address}
              lat={delivery.lat ? Number(delivery.lat) : undefined}
              lng={delivery.lng ? Number(delivery.lng) : undefined}
              status={delivery.status}
              phone={delivery.phone} // Repassando o telefone para o card
              onUpdateStatus={handleUpdateStatus}
            />
          ))
        )}
      </div>
    </div>
  );
}