'use client';

import { useState } from 'react';
import { MapPin, Navigation, CheckCircle2, Phone, MessageCircle, Edit3, Save, X } from 'lucide-react';

interface CourierDeliveryCardProps {
  id: string;
  trackingCode: string;
  recipientName: string;
  address: string;
  lat?: number;
  lng?: number;
  status: 'PENDING' | 'IN_TRANSIT' | 'DELIVERED';
  phone?: string | null;
  completionNotes?: string | null;
  deliveryFee?: number | null;
  onUpdateStatus: (id: string, newStatus: 'IN_TRANSIT' | 'DELIVERED', extraData?: { completion_notes?: string; delivery_fee?: number }) => void;
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
  completionNotes,
  deliveryFee,
  onUpdateStatus,
}: CourierDeliveryCardProps) {
  const [isCompleting, setIsCompleting] = useState(false);
  const [notesInput, setNotesInput] = useState(completionNotes || '');

  const handleOpenGPS = () => {
    if (lat && lng) {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
    } else {
      window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`, '_blank');
    }
  };

  const cleanPhone = phone ? phone.replace(/\D/g, '') : '';

  const handleSaveDelivery = (targetStatus: 'IN_TRANSIT' | 'DELIVERED' = 'DELIVERED') => {
    onUpdateStatus(id, targetStatus, {
      completion_notes: notesInput,
      delivery_fee: deliveryFee !== undefined && deliveryFee !== null ? deliveryFee : 0,
    });
    setIsCompleting(false);
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

        {/* Exibição de dados de finalização se já estiver entregue e não estiver editando */}
        {status === 'DELIVERED' && !isCompleting && (
          <div className="bg-emerald-50/60 border border-emerald-100 rounded-xl p-3 space-y-1 mt-2 text-xs">
            <div className="flex justify-between items-center text-emerald-900">
              <span className="font-semibold">Recebedor/Obs:</span>
              <span className="font-mono text-slate-700">{completionNotes || 'N/A'}</span>
            </div>
            <div className="flex justify-between items-center text-emerald-900">
              <span className="font-semibold">Valor da Entrega:</span>
              <span className="font-bold text-emerald-700">R$ {Number(deliveryFee || 0).toFixed(2)}</span>
            </div>
          </div>
        )}

        {/* Formulário de conclusão / reedição com contraste corrigido */}
        {isCompleting && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-3 mt-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900">Finalizar / Concluir Entrega</span>
              <button onClick={() => setIsCompleting(false)} className="text-slate-500 hover:text-slate-800">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-2">
              <div>
                <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">Nome Recebedor / Código</label>
                <input
                  type="text"
                  placeholder="Ex: João (Portaria) ou Cod 123"
                  value={notesInput}
                  onChange={(e) => setNotesInput(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-400"
                />
              </div>
              <button
                onClick={() => handleSaveDelivery('DELIVERED')}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg flex items-center justify-center gap-1.5 transition shadow"
              >
                <Save className="h-3.5 w-3.5" />
                <span>Salvar e Concluir</span>
              </button>
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

        {status === 'IN_TRANSIT' && !isCompleting && (
          <button
            onClick={() => setIsCompleting(true)}
            className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition shadow-md shadow-emerald-600/20"
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Concluir</span>
          </button>
        )}

        {status === 'DELIVERED' && !isCompleting && (
          <button
            onClick={() => setIsCompleting(true)}
            className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition shadow-sm"
          >
            <Edit3 className="h-3.5 w-3.5" />
            <span>Editar Obs.</span>
          </button>
        )}
      </div>
    </div>
  );
}