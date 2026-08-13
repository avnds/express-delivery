'use client';

import { MapPin, Navigation, CheckCircle2, Phone, MessageCircle } from 'lucide-react';

interface CourierDeliveryCardProps {
  id: string;
  trackingCode: string;
  recipientName: string;
  address: string;
  lat?: number;
  lng?: number;
  status: 'PENDING' | 'IN_TRANSIT' | 'DELIVERED';
  phone?: string | null;
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
  phone,
  onUpdateStatus,
}: CourierDeliveryCardProps) {
  const handleOpenGPS = () => {
    if (lat && lng) {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
    } else {
      window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`, '_blank');
    }
  };

  const cleanPhone = phone ? phone.replace(/\D/g, '') : '';

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

      <div className="space-y-2">
        <div>
          <h3 className="font-bold text-slate-900 text-sm mb-1">{recipientName}</h3>
          <p className="text-xs text-slate-500 flex items-start gap-1.5 leading-relaxed">
            <MapPin className="h-4 w-4 text-indigo-600 shrink-0 mt-0.5" />
            <span>{address}</span>
          </p>
        </div>

        {phone && (
          <div className="flex items-center gap-2 pt-1">
            <span className="text-xs font-medium text-slate-600">Tel: {phone}</span>
            <div className="flex items-center gap-1.5 ml-auto">
              <a
                href={`tel:${cleanPhone}`}
                className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition"
                title="Ligar"
              >
                <Phone className="h-3.5 w-3.5" />
              </a>
              <a
                href={`https://wa.me/55${cleanPhone}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg transition"
                title="WhatsApp"
              >
                <MessageCircle className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
        <button
          onClick={handleOpenGPS}
          className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition"
        >
          <Navigation className="h-3.5 w-3.5 text-indigo-600" />
          <span>GPS</span>
        </button>

        {status === 'PENDING' && (
          <button
            onClick={() => onUpdateStatus(id, 'IN_TRANSIT')}
            className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition shadow-md shadow-indigo-600/20"
          >
            Coletar
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