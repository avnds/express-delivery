'use client';

import { useState, useEffect } from 'react';
import { PackagePlus, Loader2, MapPin, CheckCircle2 } from 'lucide-react';

interface AddressSuggestion {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  address?: {
    road?: string;
    house_number?: string;
    suburb?: string;
    city?: string;
    town?: string;
    municipality?: string;
  };
}

export default function OperatorPage() {
  const [trackingCode, setTrackingCode] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);

  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Debounce para a busca de endereço
  useEffect(() => {
    if (address.trim().length < 3 || latitude !== null) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingAddress(true);
      try {
        const response = await fetch(`/api/geocode?q=${encodeURIComponent(address)}`);
        if (response.ok) {
          const data = await response.json();
          setSuggestions(data);
        }
      } catch (error) {
        console.error('Erro ao buscar sugestões:', error);
      } finally {
        setIsSearchingAddress(false);
      }
    }, 500); // Aguarda 500ms após o usuário parar de digitar

    return () => clearTimeout(timer);
  }, [address, latitude]);

  const handleAddressChange = (value: string) => {
    setAddress(value);
    setLatitude(null);
    setLongitude(null);
  };

  const handleSelectSuggestion = (suggestion: AddressSuggestion) => {
    const addr = suggestion.address;

    // Se o Nominatim retornou os detalhes estruturados, montamos o texto amigável com número
    if (addr && addr.road) {
      const street = addr.road;
      const number = addr.house_number ? `, ${addr.house_number}` : '';
      const neighborhood = addr.suburb ? ` - ${addr.suburb}` : '';
      const city = addr.city || addr.town || addr.municipality;
      const cityText = city ? ` (${city})` : '';

      const formattedAddress = `${street}${number}${neighborhood}${cityText}`;
      setAddress(formattedAddress);
    } else {
      setAddress(suggestion.display_name);
    }

    setLatitude(parseFloat(suggestion.lat));
    setLongitude(parseFloat(suggestion.lon));
    setSuggestions([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingCode || !recipientName) return;

    setIsSubmitting(true);
    setSuccessMessage('');

    try {
      const res = await fetch('/api/deliveries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tracking_code: trackingCode,
          recipient_name: recipientName,
          address,
          latitude,
          longitude,
        }),
      });

      if (res.ok) {
        setSuccessMessage('Entrega cadastrada com sucesso!');
        setTrackingCode('');
        setRecipientName('');
        setAddress('');
        setLatitude(null);
        setLongitude(null);
      } else {
        const errData = await res.json();
        alert(`Erro ao criar entrega: ${errData.error || 'Falha no servidor'}`);
      }
    } catch (error) {
      console.error('Erro ao enviar formulário:', error);
      alert('Erro de conexão ao criar entrega.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 flex items-center justify-center">
      <div className="max-w-lg w-full bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-md shadow-blue-600/20">
            <PackagePlus className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900">Painel do Operador</h1>
            <p className="text-xs text-slate-500">Cadastrar nova ordem de entrega</p>
          </div>
        </div>

        {successMessage && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Código de Rastreio *
            </label>
            <input
              type="text"
              required
              placeholder="Ex: TRK-123456"
              value={trackingCode}
              onChange={(e) => setTrackingCode(e.target.value)}
              className="w-full text-xs p-3 border border-slate-300 rounded-xl bg-white font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Nome do Destinatário *
            </label>
            <input
              type="text"
              required
              placeholder="Ex: João da Silva"
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              className="w-full text-xs p-3 border border-slate-300 rounded-xl bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div className="relative">
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Endereço com Busca GPS
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Ex: Rua Firmino Rocha Aguiar, 1835 - Fortaleza"
                value={address}
                onChange={(e) => handleAddressChange(e.target.value)}
                className="w-full text-xs p-3 pr-10 border border-slate-300 rounded-xl bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
              {isSearchingAddress && (
                <div className="absolute right-3 top-3">
                  <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                </div>
              )}
            </div>

            {/* Sugestões de Endereço */}
            {suggestions.length > 0 && (
              <ul className="absolute z-10 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto divide-y divide-slate-100">
                {suggestions.map((item) => (
                  <li
                    key={item.place_id}
                    onClick={() => handleSelectSuggestion(item)}
                    className="p-3 text-xs text-slate-700 hover:bg-slate-50 cursor-pointer flex items-start gap-2"
                  >
                    <MapPin className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                    <span>{item.display_name}</span>
                  </li>
                ))}
              </ul>
            )}

            {/* Exibição das coordenadas encontradas */}
            {latitude !== null && longitude !== null && (
              <div className="mt-2 p-2 bg-slate-100 rounded-lg text-[11px] font-mono text-slate-600 flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-emerald-600" />
                <span>GPS: {latitude.toFixed(6)}, {longitude.toFixed(6)}</span>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Salvando...</span>
              </>
            ) : (
              <span>Criar Ordem de Entrega</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}