'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Shield, Loader2, Edit3, Check, X, Phone, MessageSquare, DollarSign, Trash2, Download, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface DeliveryItem {
  id: string;
  tracking_code: string;
  recipient_name: string;
  address: string;
  lat: number | null;
  lng: number | null;
  status: 'PENDING' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED';
  phone?: string | null;
  completion_notes?: string | null;
  delivery_fee?: number | null;
}

export default function SupervisorPage() {
  const router = useRouter();
  const [deliveries, setDeliveries] = useState<DeliveryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isClearing, setIsClearing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

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
  const [editPhone, setEditPhone] = useState('');
  const [editDeliveryFee, setEditDeliveryFee] = useState('');

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

  // Função para exportar o arquivo .txt
  const handleExportTxt = async () => {
    try {
      setIsExporting(true);
      const res = await fetch('/api/supervisor/data');
      if (!res.ok) throw new Error('Falha ao exportar');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `historico-entregas-${new Date().toISOString().slice(0, 10)}.txt`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (error) {
      alert('Erro ao baixar o histórico.');
    } finally {
      setIsExporting(false);
    }
  };

  // Função para apagar todos os dados operacionais
  const handleClearData = async () => {
    const confirmation = window.confirm(
      'ATENÇÃO: Tem certeza que deseja apagar todos os dados operacionais? Esta ação não pode ser desfeita.'
    );
    if (!confirmation) return;

    try {
      setIsClearing(true);
      const res = await fetch('/api/supervisor/data', {
        method: 'DELETE',
      });

      if (res.ok) {
        alert('Dados operacionais apagados com sucesso!');
        fetchDeliveries(true);
      } else {
        alert('Erro ao apagar os dados.');
      }
    } catch (error) {
      alert('Erro de rede ao tentar limpar os dados.');
    } finally {
      setIsClearing(false);
    }
  };

  // Apenas atualiza o texto e limpa as coordenadas para envio puramente em string
  const handleAddressChange = (value: string) => {
    setEditAddress(value);
    setEditLatitude(null);
    setEditLongitude(null);
  };

  const handleStartEdit = (item: DeliveryItem) => {
    isEditingRef.current = true;
    setEditingId(item.id);
    setEditRecipient(item.recipient_name);
    setEditAddress(item.address || '');
    setEditLatitude(item.lat ?? null);
    setEditLongitude(item.lng ?? null);
    setEditTrackingCode(item.tracking_code);
    setEditStatus(item.status);
    setEditPhone(item.phone || '');
    setEditDeliveryFee(item.delivery_fee !== undefined && item.delivery_fee !== null ? String(item.delivery_fee) : '');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    isEditingRef.current = false;
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
          phone: editPhone,
          delivery_fee: editDeliveryFee !== '' ? parseFloat(editDeliveryFee) : 0,
        }),
      });

      if (res.ok) {
        setEditingId(null);
        isEditingRef.current = false;
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
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-[#FF6600] pb-4">
          <div className="flex items-center gap-3">
            <div className="p-1 bg-[#FFFFFF] text-white rounded-2xl shadow-md shadow-[#002B5C]/20">
              <img
                src="/ico android.png"
                alt="Rotix"
                className="h-10 w-10 object-contain"
              />
            </div>
            <div>
              <h1 className="text-2xl font-black text-[#002B5C] tracking-tight">
                Painel do Supervisor
              </h1>
              <p className="text-xs text-slate-500">Gerenciamento global e edição total das ordens de entrega</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportTxt}
              disabled={isExporting}
              className="px-3 py-2 bg-[#002B5C] hover:bg-[#00234D] text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition shadow-sm disabled:opacity-50"
            >
              {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              <span>Salvar Histórico (.txt)</span>
            </button>

            <button
              onClick={handleClearData}
              disabled={isClearing}
              className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-bold text-xs rounded-xl flex items-center gap-1.5 transition disabled:opacity-50"
            >
              {isClearing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              <span>Apagar Dados</span>
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="px-3 py-2 bg-slate-100 hover:bg-[#002B5C] text-slate-600 hover:text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition"
            >
              <LogOut className="h-4 w-4" />
              <span>Sair</span>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 font-bold text-xs text-slate-700 uppercase tracking-wider">
            Ordens Registradas ({deliveries.length})
          </div>

          {isLoading ? (
            <div className="p-8 flex items-center justify-center text-slate-400 text-xs gap-2">
              <Loader2 className="h-5 w-5 animate-spin text-[#002B5C]" />
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
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
                          <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase">Cód. Rastreio</label>
                            <input
                              type="text"
                              value={editTrackingCode}
                              onChange={(e) => setEditTrackingCode(e.target.value)}
                              className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FF6600]/30 focus:border-[#FF6600]"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase">Destinatário</label>
                            <input
                              type="text"
                              value={editRecipient}
                              onChange={(e) => setEditRecipient(e.target.value)}
                              className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FF6600]/30 focus:border-[#FF6600]"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase">Telefone / WhatsApp</label>
                            <input
                              type="text"
                              value={editPhone}
                              onChange={(e) => setEditPhone(e.target.value)}
                              placeholder="(00) 00000-0000"
                              className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FF6600]/30 focus:border-[#FF6600]"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase">Valor da Entrega (R$)</label>
                            <input
                              type="number"
                              step="0.01"
                              value={editDeliveryFee}
                              onChange={(e) => setEditDeliveryFee(e.target.value)}
                              placeholder="0.00"
                              className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FF6600]/30 focus:border-[#FF6600]"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase">Status</label>
                            <select
                              value={editStatus}
                              onChange={(e) => setEditStatus(e.target.value as DeliveryItem['status'])}
                              className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FF6600]/30 focus:border-[#FF6600]"
                            >
                              <option value="PENDING">PENDING</option>
                              <option value="IN_TRANSIT">IN_TRANSIT</option>
                              <option value="DELIVERED">DELIVERED</option>
                              <option value="CANCELLED">CANCELLED</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase">Endereço (Texto Livre)</label>
                          <input
                            type="text"
                            value={editAddress}
                            onChange={(e) => handleAddressChange(e.target.value)}
                            className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FF6600]/30 focus:border-[#FF6600]"
                            placeholder="Digite o endereço..."
                          />
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
                            className="px-3 py-1.5 text-xs font-semibold text-white bg-[#002B5C] rounded-lg flex items-center gap-1 hover:bg-[#00234D] shadow-sm"
                          >
                            <Check className="h-3.5 w-3.5" />
                            Salvar Alterações
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono font-bold text-xs bg-slate-100 text-slate-800 px-2 py-0.5 rounded">
                              {item.tracking_code}
                            </span>
                            <span className="text-xs font-bold text-slate-900">{item.recipient_name}</span>
                            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md flex items-center gap-0.5 border border-emerald-100">
                              <DollarSign className="h-3 w-3" />
                              {Number(item.delivery_fee || 0).toFixed(2)}
                            </span>
                            {item.completion_notes && (
                              <span className="text-[11px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded italic">
                                Obs/Recebedor: {item.completion_notes}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500">{item.address || 'Sem endereço informado'}</p>
                          
                          {item.phone && (
                            <div className="flex items-center gap-3 pt-1">
                              <span className="text-[11px] text-slate-600 font-medium">Tel: {item.phone}</span>
                              <div className="flex items-center gap-1.5">
                                <a
                                  href={`tel:${item.phone}`}
                                  className="px-2 py-0.5 text-[10px] font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md flex items-center gap-1 transition"
                                  title="Ligar"
                                >
                                  <Phone className="h-3 w-3 text-slate-600" />
                                  Ligar
                                </a>
                                <a
                                  href={`https://wa.me/55${item.phone.replace(/\D/g, '')}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-2 py-0.5 text-[10px] font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-md flex items-center gap-1 shadow-sm transition"
                                  title="WhatsApp"
                                >
                                  <MessageSquare className="h-3 w-3" />
                                  WhatsApp
                                </a>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-3">
                          <select
                            value={item.status}
                            onChange={(e) => handleQuickStatusChange(item.id, e.target.value as DeliveryItem['status'])}
                            className="text-xs border border-slate-300 rounded-xl px-3 py-1.5 bg-slate-50 font-medium text-slate-700 outline-none focus:ring-2 focus:ring-[#FF6600]/30 focus:border-[#FF6600]"
                          >
                            <option value="PENDING">PENDING</option>
                            <option value="IN_TRANSIT">IN_TRANSIT</option>
                            <option value="DELIVERED">DELIVERED</option>
                            <option value="CANCELLED">CANCELLED</option>
                          </select>

                          <button
                            onClick={() => handleStartEdit(item)}
                            className="p-2 text-slate-500 hover:text-[#002B5C] hover:bg-slate-100 rounded-xl transition"
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