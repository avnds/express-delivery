'use client';

import { useState } from 'react';
import { LocationIQAutocomplete } from './LocationIQAutocomplete';
import { X, PackagePlus, Check } from 'lucide-react';

interface CreateDeliveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateDeliveryModal({ isOpen, onClose, onSuccess }: CreateDeliveryModalProps) {
  const [recipientName, setRecipientName] = useState('');
  const [address, setAddress] = useState('');
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/deliveries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipientName, address, lat, lng }),
      });

      if (!res.ok) throw new Error('Falha ao cadastrar');

      setRecipientName('');
      setAddress('');
      setLat(null);
      setLng(null);
      
      onSuccess();
      onClose();
    } catch {
      alert('Erro ao criar entrega no banco de dados.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100">
        <div className="flex items-center justify-between p-5 bg-indigo-600 text-white">
          <div className="flex items-center gap-2 font-bold text-base">
            <PackagePlus className="h-5 w-5" />
            <span>Nova Ordem de Entrega</span>
          </div>
          <button onClick={onClose} className="text-indigo-200 hover:text-white transition">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Nome do Destinatário
            </label>
            <input
              type="text"
              required
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              placeholder="Ex: João Silva"
              className="w-full px-4 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 transition outline-none text-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Endereço de Entrega (Autocomplete)
            </label>
            <LocationIQAutocomplete
              onSelectAddress={(selectedAddress, selectedLat, selectedLng) => {
                setAddress(selectedAddress);
                setLat(selectedLat);
                setLng(selectedLng);
              }}
            />
          </div>

          {lat && lng && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 font-medium flex items-center gap-2">
              <Check className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>Coordenadas de GPS capturadas com sucesso!</span>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !address}
              className="px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-xl transition shadow-lg shadow-indigo-600/20 disabled:opacity-50"
            >
              {isSubmitting ? 'Cadastrando...' : 'Criar Entrega'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}