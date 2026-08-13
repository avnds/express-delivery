'use client';

import { MapPin, Navigation, CheckCircle2 } from 'lucide-react';

interface CourierDeliveryCardProps {
  id: string;
  trackingCode: string;
  recipientName: string;
  address: string;
  lat?: number;
  lng?: number;
  status: 'PENDING' | 'IN_TRANSIT' | 'DELIVERED';
  onUpdateStatus: (id: string, newStatus: 'IN_TRANSIT' | 'DELIVERED') => void;
}

export function CourierDeliveryCard({
  id,
  trackingCode,
  recipientName,
  address,
  lat,
  lng,
  status,
  onUpdateStatus,
}: CourierDeliveryCardProps) {
  const handleOpenGPS = () => {
    if (lat && lng) {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
    } else {
      window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`, '_blank');
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <span className="font-mono font-bold text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg">
          {trackingCode}
        </span>
        <span
          className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
            status === 'PENDING'
              ? 'bg-amber-100 text-amber-800'
              : status === 'IN_TRANSIT'
              ? 'bg-indigo-100 text-indigo-800'
              : 'bg-emerald-100 text-emerald-800'
          }`}
        >
          {status === 'PENDING' ? 'Disponível' : status === 'IN_TRANSIT' ? 'Em Rota' : 'Entregue'}
        </span>
      </div>

      <div>
        <h3 className="font-bold text-slate-900 text-sm mb-1">{recipientName}</h3>
        <p className="text-xs text-slate-500 flex items-start gap-1.5 leading-relaxed">
          <MapPin className="h-4 w-4 text-indigo-600 shrink-0 mt-0.5" />
          <span>{address}</span>
        </p>
      </div>

      <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
        <button
          onClick={handleOpenGPS}
          className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition"
        >
          <Navigation className="h-3.5 w-3.5 text-indigo-600" />
          <span>Abrir GPS</span>
        </button>

        {status === 'PENDING' && (
          <button
            onClick={() => onUpdateStatus(id, 'IN_TRANSIT')}
            className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition shadow-md shadow-indigo-600/20"
          >
            Coletar Entrega
          </button>
        )}

        {status === 'IN_TRANSIT' && (
          <button
            onClick={() => onUpdateStatus(id, 'DELIVERED')}
            className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition shadow-md shadow-emerald-600/20"
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Concluir</span>
          </button>
        )}
      </div>
    </div>
  );
}