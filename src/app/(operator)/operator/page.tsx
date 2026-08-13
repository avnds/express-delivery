'use client';

import { useState, useEffect, useCallback } from 'react';
import { CreateDeliveryModal } from '@/components/operator/CreateDeliveryModal';
import { Plus, Package, Clock, CheckCircle2, Search, MapPin } from 'lucide-react';

interface Delivery {
  id: string;
  tracking_code: string;
  recipient_name: string;
  address: string;
  status: 'PENDING' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED';
}

export default function OperatorPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDeliveries = useCallback(async () => {
    try {
      const res = await fetch('/api/deliveries');
      if (res.ok) {
        const data = await res.json();
        setDeliveries(data);
      }
    } catch {
      console.error('Erro ao buscar entregas');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDeliveries();
  }, [fetchDeliveries]);

  const filtered = deliveries.filter(
    (item) =>
      item.recipient_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.tracking_code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pendingCount = deliveries.filter((d) => d.status === 'PENDING').length;
  const inTransitCount = deliveries.filter((d) => d.status === 'IN_TRANSIT').length;
  const deliveredCount = deliveries.filter((d) => d.status === 'DELIVERED').length;

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Painel do Operador</h1>
            <p className="text-xs text-slate-500 mt-1">Gestão e cadastro de novas expedições de entrega</p>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-xs rounded-xl transition shadow-lg shadow-indigo-600/20"
          >
            <Plus className="h-4 w-4" />
            <span>Nova Entrega</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
              <Clock className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Aguardando Fila</p>
              <p className="text-2xl font-black text-slate-900">{pendingCount}</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
              <Package className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Em Trânsito</p>
              <p className="text-2xl font-black text-slate-900">{inTransitCount}</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Entregues</p>
              <p className="text-2xl font-black text-slate-900">{deliveredCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between gap-4">
            <h2 className="font-bold text-slate-900 text-sm">Entregas Cadastradas</h2>
            <div className="relative w-64">
              <input
                type="text"
                placeholder="Buscar por código ou destinatário..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-600"
              />
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            </div>
          </div>

          {isLoading ? (
            <div className="p-8 text-center text-slate-400 text-xs">Carregando entregas do banco...</div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs font-medium">
              Nenhuma entrega encontrada. Clique em <strong className="text-indigo-600">"Nova Entrega"</strong> para cadastrar.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filtered.map((item) => (
                <div key={item.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs bg-slate-100 text-slate-800 px-2 py-0.5 rounded">
                        {item.tracking_code}
                      </span>
                      <span className="text-xs font-bold text-slate-900">{item.recipient_name}</span>
                    </div>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                      <MapPin className="h-3 w-3 text-indigo-600 shrink-0" />
                      <span>{item.address}</span>
                    </p>
                  </div>
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                      item.status === 'PENDING'
                        ? 'bg-amber-100 text-amber-800'
                        : item.status === 'IN_TRANSIT'
                        ? 'bg-indigo-100 text-indigo-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <CreateDeliveryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchDeliveries}
      />
    </div>
  );
}