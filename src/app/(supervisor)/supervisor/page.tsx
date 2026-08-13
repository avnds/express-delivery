'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Shield, Loader2, Edit3, Check, X, MapPin } from 'lucide-react';

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

interface DeliveryItem {
  id: string;
  tracking_code: string;
  recipient_name: string;
  address: string;
  lat: number | null;
  lng: number | null;
  status: 'PENDING' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED';
}

export default function SupervisorPage() {
  const [deliveries, setDeliveries] = useState<DeliveryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Ref para controlar se estamos editando (evita congelamento pelo polling)
  const isEditingRef = useRef(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Estados para o formulário de edição
  const [editRecipient, setEditRecipient] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editLatitude, setEditLatitude] = useState<number | null>(null);
  const [editLongitude, setEditLongitude] = useState<number | null>(null);
  const [editTrackingCode, setEditTrackingCode] = useState('');
  const [editStatus, setEditStatus] = useState<DeliveryItem['status']>('PENDING');

  // Estados para sugestões de endereço no Supervisor
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);
  const [isSelectingSuggestion, setIsSelectingSuggestion] = useState(false);

  const fetchDeliveries = useCallback(async (isSilent = false) => {
    if (isEditingRef.current) return;

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

    const interval = setInterval(() => {
      fetchDeliveries(true);
    }, 4000);

    return () => clearInterval(interval);
  }, [fetchDeliveries]);

  // Debounce para a busca de endereço GPS na edição
  useEffect(() => {
    if (isSelectingSuggestion) return;
    if (editAddress.trim().length < 3 || editLatitude !== null) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingAddress(true);
      try {
        const response = await fetch(`/api/geocode?q=${encodeURIComponent(editAddress)}`);
        if (response.ok) {
          const data = await response.json();
          setSuggestions(data);
        }
      } catch (error) {
        console.error('Erro ao buscar sugestões:', error);
      } finally {
        setIsSearchingAddress(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [editAddress, editLatitude, isSelectingSuggestion]);

  const handleAddressChange = (value: string) => {
    setIsSelectingSuggestion(false);
    setEditAddress(value);
    setEditLatitude(null);
    setEditLongitude(null);
  };

  const handleSelectSuggestion = (suggestion: AddressSuggestion) => {
    setIsSelectingSuggestion(true);
    
    const addr = suggestion.address;
    let formattedAddress = suggestion.display_name;

    if (addr) {
      const road = addr.road || '';
      const houseNumber = addr.house_number || '';
      
      if (road) {
        formattedAddress = houseNumber 
          ? `${road}, ${houseNumber}` 
          : road;
      }
    }

    setEditAddress(formattedAddress);
    setEditLatitude(parseFloat(suggestion.lat));
    setEditLongitude(parseFloat(suggestion.lon));
    setSuggestions([]);
  };

  const handleStartEdit = (item: DeliveryItem) => {
    isEditingRef.current = true;
    setIsSelectingSuggestion(false);
    setEditingId(item.id);
    setEditRecipient(item.recipient_name);
    setEditAddress(item.address || '');
    setEditLatitude(item.lat ?? null);
    setEditLongitude(item.lng ?? null);
    setEditTrackingCode(item.tracking_code);
    setEditStatus(item.status);
    setSuggestions([]);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    isEditingRef.current = false;
    setIsSelectingSuggestion(false);
    setSuggestions([]);
  };

  const handleSaveEdit = async (id: string) => {
    try {
      const res = await fetch(`/api/deliveries/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient_name: editRecipient,
          address: editAddress,
          latitude: editLatitude,
          longitude: editLongitude,
          tracking_code: editTrackingCode,
          status: editStatus,
        }),
      });

      if (res.ok) {
        setEditingId(null);
        isEditingRef.current = false;
        setIsSelectingSuggestion(false);
        fetchDeliveries(true);
      } else {
        alert('Erro ao atualizar entrega.');
      }
    } catch {
      alert('Erro de conexão ao salvar alterações.');
    }
  };

  const handleQuickStatusChange = async (id: string, newStatus: DeliveryItem['status']) => {
    if (isEditingRef.current) return;

    try {
      const res = await fetch(`/api/deliveries/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        fetchDeliveries(true);
      } else {
        alert('Erro ao atualizar status.');
      }
    } catch {
      alert('Erro de conexão.');
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
              <p className="text-xs text-slate-500">Gerenciamento global e edição total das ordens de entrega</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 font-bold text-xs text-slate-700 uppercase tracking-wider">
            Ordens Registradas ({deliveries.length})
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
              {deliveries.map((item) => {
                const isEditing = editingId === item.id;

                return (
                  <div key={item.id} className="p-4 hover:bg-slate-50 transition">
                    {isEditing ? (
                      <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase">Cód. Rastreio</label>
                            <input
                              type="text"
                              value={editTrackingCode}
                              onChange={(e) => setEditTrackingCode(e.target.value)}
                              className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white font-mono text-slate-900"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase">Destinatário</label>
                            <input
                              type="text"
                              value={editRecipient}
                              onChange={(e) => setEditRecipient(e.target.value)}
                              className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white text-slate-900"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase">Status</label>
                            <select
                              value={editStatus}
                              onChange={(e) => setEditStatus(e.target.value as DeliveryItem['status'])}
                              className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white font-medium text-slate-900"
                            >
                              <option value="PENDING">PENDING</option>
                              <option value="IN_TRANSIT">IN_TRANSIT</option>
                              <option value="DELIVERED">DELIVERED</option>
                              <option value="CANCELLED">CANCELLED</option>
                            </select>
                          </div>
                        </div>

                        <div className="relative">
                          <label className="text-[10px] font-bold text-slate-500 uppercase">Endereço com Busca GPS</label>
                          <div className="relative">
                            <input
                              type="text"
                              value={editAddress}
                              onChange={(e) => handleAddressChange(e.target.value)}
                              className="w-full text-xs p-2 pr-8 border border-slate-300 rounded-lg bg-white text-slate-900"
                              placeholder="Digite o novo endereço..."
                            />
                            {isSearchingAddress && (
                              <div className="absolute right-2 top-2.5">
                                <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                              </div>
                            )}
                          </div>

                          {/* Sugestões de Endereço */}
                          {suggestions.length > 0 && (
                            <ul className="absolute z-10 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto divide-y divide-slate-100">
                              {suggestions.map((suggestion) => (
                                <li
                                  key={suggestion.place_id}
                                  onClick={() => handleSelectSuggestion(suggestion)}
                                  className="p-3 text-xs text-slate-700 hover:bg-slate-50 cursor-pointer flex items-start gap-2"
                                >
                                  <MapPin className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                                  <span>{suggestion.display_name}</span>
                                </li>
                              ))}
                            </ul>
                          )}

                          {/* Exibição das coordenadas encontradas na edição */}
                          {editLatitude !== null && editLongitude !== null && (
                            <div className="mt-1.5 p-2 bg-slate-100 rounded-lg text-[11px] font-mono text-slate-600 flex items-center gap-1.5">
                              <MapPin className="h-3.5 w-3.5 text-emerald-600" />
                              <span>GPS Atualizado: {editLatitude.toFixed(6)}, {editLongitude.toFixed(6)}</span>
                            </div>
                          )}
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                          <button
                            onClick={handleCancelEdit}
                            className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-300 rounded-lg flex items-center gap-1 hover:bg-slate-100"
                          >
                            <X className="h-3.5 w-3.5" />
                            Cancelar
                          </button>
                          <button
                            onClick={() => handleSaveEdit(item.id)}
                            className="px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 rounded-lg flex items-center gap-1 hover:bg-emerald-700 shadow-sm"
                          >
                            <Check className="h-3.5 w-3.5" />
                            Salvar Alterações
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-xs bg-slate-100 text-slate-800 px-2 py-0.5 rounded">
                              {item.tracking_code}
                            </span>
                            <span className="text-xs font-bold text-slate-900">{item.recipient_name}</span>
                          </div>
                          <p className="text-xs text-slate-500">{item.address || 'Sem endereço informado'}</p>
                        </div>

                        <div className="flex items-center gap-3">
                          <select
                            value={item.status}
                            onChange={(e) => handleQuickStatusChange(item.id, e.target.value as DeliveryItem['status'])}
                            className="text-xs border border-slate-300 rounded-xl px-3 py-1.5 bg-slate-50 font-medium text-slate-700 outline-none focus:ring-2 focus:ring-red-600"
                          >
                            <option value="PENDING">PENDING</option>
                            <option value="IN_TRANSIT">IN_TRANSIT</option>
                            <option value="DELIVERED">DELIVERED</option>
                            <option value="CANCELLED">CANCELLED</option>
                          </select>

                          <button
                            onClick={() => handleStartEdit(item)}
                            className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition"
                            title="Editar entrega"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    )}
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