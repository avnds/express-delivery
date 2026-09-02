'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { CourierDeliveryCard } from '@/components/courier/CourierDeliveryCard';
//import { Truck, DollarSign, Loader2 } from 'lucide-react';
import { Truck, DollarSign, Loader2, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import PushNotificationButton from '@/components/PushNotificationButton';

interface Delivery {
  id: string;
  tracking_code: string;
  recipient_name: string;
  address: string;
  lat?: number | string;
  lng?: number | string;
  status: 'PENDING' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED';
  phone?: string | null;
  completion_notes?: string | null;
  delivery_fee?: number | null;
}

export default function CourierPage() {
  const router = useRouter();
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const previousDeliveryIdsRef = useRef<string[]>([]);
  const isFirstLoadRef = useRef(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const playNotificationSound = useCallback(() => {
    try {
      if (!audioRef.current) {
        audioRef.current = new Audio('/sounds/nova-entrega.mp3');
        audioRef.current.volume = 1;
      }

      audioRef.current.currentTime = 0;

      audioRef.current.play().catch((error) => {
        console.warn('Não foi possível reproduzir o som:', error);
      });
    } catch (error) {
      console.warn('Erro ao reproduzir som de notificação:', error);
    }
  }, []);

  const fetchDeliveries = useCallback(async (isSilent = false) => {
    if (!isSilent) setIsLoading(true);

    try {
      const res = await fetch('/api/deliveries', {
        cache: 'no-store',
      });

      if (res.ok) {
        const data: Delivery[] = await res.json();

        const filteredDeliveries = data.filter(
          (d) =>
            d.status !== 'DELIVERED' &&
            d.status !== 'CANCELLED'
        );

        const currentIds = filteredDeliveries.map(
          (delivery) => delivery.id
        );

        if (!isFirstLoadRef.current) {
          const hasNewDelivery = currentIds.some(
            (id) =>
              !previousDeliveryIdsRef.current.includes(id)
          );

          if (hasNewDelivery) {
            playNotificationSound();
          }
        }

        previousDeliveryIdsRef.current = currentIds;
        isFirstLoadRef.current = false;

        setDeliveries(filteredDeliveries);
      }
    } catch (error) {
      console.error(
        'Erro ao carregar entregas do entregador:',
        error
      );
    } finally {
      if (!isSilent) setIsLoading(false);
    }
  }, [playNotificationSound]);

  useEffect(() => {
    // Busca inicial
    fetchDeliveries();

    // Escuta eventos enviados pelo Service Worker
    const handleServiceWorkerMessage = (
      event: MessageEvent
    ) => {
      if (
        event.data?.type !== 'DATA_CHANGED' &&
        event.data?.type !== 'NEW_DELIVERY'
      ) {
        return;
      }

      console.log(
        '[Rotix] Evento de sincronização recebido:',
        event.data
      );

      // O Push apenas dispara uma nova busca.
      // A API continua sendo a fonte oficial dos dados.
      fetchDeliveries(true);
    };

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener(
        'message',
        handleServiceWorkerMessage
      );
    }

    return () => {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener(
          'message',
          handleServiceWorkerMessage
        );
      }
    };
  }, [fetchDeliveries]);

  const handleUpdateStatus = async (
    id: string,
    newStatus: 'IN_TRANSIT' | 'DELIVERED',
    extraData?: {
      completion_notes?: string;
      delivery_fee?: number;
    }
  ) => {
    try {
      const res = await fetch(`/api/deliveries/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
          ...extraData,
        }),
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

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
      });
    } finally {
      router.push('/login');
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 pb-12">
      <div className="bg-[#002B5C] text-white p-5 sticky top-0 z-40 shadow-md">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1 bg-[#FFFFFF] rounded-xl shadow-md shadow-black/20">
              <img
                src="/ico android.png"
                alt="Rotix"
                className="h-10 w-10 object-contain"
              />
            </div>

            <div>
              <h1 className="font-black text-sm tracking-tight">
                Fila de Entregas
              </h1>

              <p className="text-[10px] text-slate-400">
                Visão do Entregador
              </p>
            </div>
          </div>

          <a
            href="/courier/earnings"
            className="p-2 bg-[#001B3D] hover:bg-[#00234D] rounded-xl text-emerald-400 text-xs font-bold flex items-center gap-1 transition"
          >
            <DollarSign className="h-4 w-4" />
            <span>Ganhos</span>
          </a>

          <button
            type="button"
            onClick={handleLogout}
            className="p-2 bg-[#001B3D] hover:bg-[#002B5C] rounded-xl text-slate-300 hover:text-white text-xs font-bold flex items-center gap-1 transition"
          >
            <LogOut className="h-4 w-4" />
            <span>Sair</span>
          </button>
        </div>
      </div>

      <div className="max-w-md mx-auto p-4 space-y-4">
        <div className="bg-white rounded-2xl p-3 border border-slate-200">
          <PushNotificationButton />
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-8 text-slate-400 text-xs gap-2">
            <Loader2 className="h-6 w-6 animate-spin text-[#002B5C]" />
            <span>
              Buscando entregas disponíveis...
            </span>
          </div>
        ) : deliveries.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl text-center text-slate-400 text-xs font-medium border border-slate-200">
            Nenhuma entrega encontrada!
          </div>
        ) : (
          deliveries.map((delivery) => (
            <CourierDeliveryCard
              key={delivery.id}
              id={delivery.id}
              trackingCode={delivery.tracking_code}
              recipientName={delivery.recipient_name}
              address={delivery.address}
              lat={
                delivery.lat
                  ? Number(delivery.lat)
                  : undefined
              }
              lng={
                delivery.lng
                  ? Number(delivery.lng)
                  : undefined
              }
              status={delivery.status}
              phone={delivery.phone}
              completionNotes={delivery.completion_notes}
              deliveryFee={delivery.delivery_fee}
              onUpdateStatus={handleUpdateStatus}
            />
          ))
        )}
      </div>
    </div>
  );
}