'use client';

import { useState } from 'react';
import {
  MapPin,
  Navigation,
  CheckCircle2,
  Phone,
  MessageCircle,
  Edit3,
  Save,
  X,
} from 'lucide-react';

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
  onUpdateStatus: (
    id: string,
    newStatus: 'IN_TRANSIT' | 'DELIVERED',
    extraData?: {
      completion_notes?: string;
      delivery_fee?: number;
    }
  ) => void;
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
      window.open(
        `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`,
        '_blank'
      );
    } else {
      window.open(
        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`,
        '_blank'
      );
    }
  };

  const cleanPhone = phone ? phone.replace(/\D/g, '') : '';

  const handleSaveDelivery = (
    targetStatus: 'IN_TRANSIT' | 'DELIVERED' = 'DELIVERED'
  ) => {
    onUpdateStatus(id, targetStatus, {
      completion_notes: notesInput,
      delivery_fee:
        deliveryFee !== undefined && deliveryFee !== null
          ? deliveryFee
          : 0,
    });

    setIsCompleting(false);
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-md space-y-5">

      {/* ============================================================
          CABEÇALHO
      ============================================================ */}
      <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <span className="font-mono font-bold text-base bg-slate-100 text-slate-800 px-3 py-2 rounded-xl">
          {trackingCode}
        </span>

        <span
          className={`text-xs font-extrabold uppercase tracking-wide px-3 py-2 rounded-full ${
            status === 'PENDING'
              ? 'bg-amber-100 text-amber-800'
              : status === 'IN_TRANSIT'
              ? 'bg-[#002B5C]/10 text-[#002B5C]'
              : 'bg-emerald-100 text-emerald-800'
          }`}
        >
          {status === 'PENDING'
            ? 'Disponível'
            : status === 'IN_TRANSIT'
            ? 'Em Rota'
            : 'Entregue'}
        </span>
      </div>

      {/* ============================================================
          DADOS DA ENTREGA
      ============================================================ */}
      <div className="space-y-5">

        <div className="space-y-3">
          <h3 className="font-extrabold text-slate-950 text-xl leading-tight">
            {recipientName}
          </h3>

          <div className="flex items-start gap-3">
            <MapPin className="h-6 w-6 text-[#002B5C] shrink-0 mt-0.5" />

            <p className="text-base sm:text-lg font-medium text-slate-700 leading-relaxed">
              {address}
            </p>
          </div>
        </div>

        {/* ============================================================
            TELEFONE
        ============================================================ */}
        {phone && (
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
            <div className="text-sm font-bold text-slate-500 uppercase tracking-wide">
              Telefone
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <span className="text-lg font-bold text-slate-800">
                {phone}
              </span>

              <div className="flex gap-2 sm:ml-auto">

                <a
                  href={`tel:${cleanPhone}`}
                  className="flex-1 sm:flex-none min-h-12 px-5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl flex items-center justify-center gap-2 font-bold text-sm transition"
                  title="Ligar"
                >
                  <Phone className="h-5 w-5" />
                  <span>Ligar</span>
                </a>

                <a
                  href={`https://wa.me/55${cleanPhone}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 sm:flex-none min-h-12 px-5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl flex items-center justify-center gap-2 font-bold text-sm transition shadow-sm"
                  title="WhatsApp"
                >
                  <MessageCircle className="h-5 w-5" />
                  <span>WhatsApp</span>
                </a>

              </div>
            </div>
          </div>
        )}

        {/* ============================================================
            DADOS DE ENTREGA CONCLUÍDA
        ============================================================ */}
        {status === 'DELIVERED' && !isCompleting && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 space-y-3">

            <div className="flex flex-col gap-1">
              <span className="text-sm font-bold text-emerald-900">
                Recebedor / Observação
              </span>

              <span className="text-base font-medium text-slate-700">
                {completionNotes || 'N/A'}
              </span>
            </div>

            <div className="flex items-center justify-between border-t border-emerald-200 pt-3">
              <span className="text-sm font-bold text-emerald-900">
                Valor da Entrega
              </span>

              <span className="text-xl font-extrabold text-emerald-700">
                R$ {Number(deliveryFee || 0).toFixed(2)}
              </span>
            </div>

          </div>
        )}

        {/* ============================================================
            FORMULÁRIO DE CONCLUSÃO
        ============================================================ */}
        {isCompleting && (
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-4">

            <div className="flex items-center justify-between gap-3">
              <span className="text-base font-extrabold text-slate-900">
                Finalizar Entrega
              </span>

              <button
                type="button"
                onClick={() => setIsCompleting(false)}
                className="min-w-11 min-h-11 flex items-center justify-center text-slate-500 hover:text-slate-800 bg-white border border-slate-200 rounded-xl"
                aria-label="Cancelar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-700">
                Nome do Recebedor / Código
              </label>

              <input
                type="text"
                placeholder="Ex: João (Portaria) ou Cod 123"
                value={notesInput}
                onChange={(e) => setNotesInput(e.target.value)}
                className="w-full min-h-14 text-base px-4 py-3 bg-white text-slate-900 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF6600]/30 focus:border-[#FF6600] placeholder:text-slate-400"
              />
            </div>

            <button
              type="button"
              onClick={() => handleSaveDelivery('DELIVERED')}
              className="w-full min-h-14 bg-[#002B5C] hover:bg-[#00234D] text-white font-extrabold text-base rounded-xl flex items-center justify-center gap-2 transition shadow-md"
            >
              <Save className="h-5 w-5" />
              <span>Salvar e Concluir</span>
            </button>

          </div>
        )}
      </div>

      {/* ============================================================
          BOTÕES PRINCIPAIS
      ============================================================ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-200">

        {/* GPS */}
        <button
          type="button"
          onClick={handleOpenGPS}
          className="min-h-14 px-5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-base rounded-xl flex items-center justify-center gap-2 transition"
        >
          <Navigation className="h-5 w-5 text-[#002B5C]" />
          <span>Abrir GPS</span>
        </button>

        {/* COLETAR */}
        {status === 'PENDING' && (
          <button
            type="button"
            onClick={() => onUpdateStatus(id, 'IN_TRANSIT')}
            className="min-h-14 px-5 bg-[#002B5C] hover:bg-[#00234D] text-white font-extrabold text-base rounded-xl transition shadow-md shadow-[#002B5C]/20"
          >
            Coletar Entrega
          </button>
        )}

        {/* CONCLUIR */}
        {status === 'IN_TRANSIT' && !isCompleting && (
          <button
            type="button"
            onClick={() => setIsCompleting(true)}
            className="min-h-14 px-5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-base rounded-xl flex items-center justify-center gap-2 transition shadow-md shadow-emerald-600/20"
          >
            <CheckCircle2 className="h-5 w-5" />
            <span>Concluir Entrega</span>
          </button>
        )}

        {/* EDITAR */}
        {status === 'DELIVERED' && !isCompleting && (
          <button
            type="button"
            onClick={() => setIsCompleting(true)}
            className="min-h-14 px-5 bg-[#002B5C] hover:bg-[#00234D] text-white font-extrabold text-base rounded-xl flex items-center justify-center gap-2 transition shadow-md"
          >
            <Edit3 className="h-5 w-5" />
            <span>Editar Observação</span>
          </button>
        )}

      </div>
    </div>
  );
}