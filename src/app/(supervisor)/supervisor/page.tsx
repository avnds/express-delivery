'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Shield, Loader2, Edit3, Check, X } from 'lucide-react';

interface DeliveryItem {
  id: string;
  tracking_code: string;
  recipient_name: string;
  address: string;
  status: 'PENDING' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED';
}

export default function SupervisorPage() {
  const [deliveries, setDeliveries] = useState<DeliveryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Ref para controlar se estamos editando (evita problemas com closure no polling)
  const isEditingRef = useRef(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Estados para o formulário de edição
  const [editRecipient, setEditRecipient] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editTrackingCode, setEditTrackingCode] = useState('');
  const [editStatus, setEditStatus] = useState<DeliveryItem['status']>('PENDING');

  const fetchDeliveries = useCallback(async (isSilent = false) => {
    // Se estiver editando, NÃO busca dados novos para não resetar o formulário
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
    // Busca inicial
    fetchDeliveries();

    // Polling a cada 4 segundos no painel do supervisor
    const interval = setInterval(() => {
      fetchDeliveries(true); // O fetch já verifica internamente se pode rodar
    }, 4000);

    return () => clearInterval(interval);
  }, [fetchDeliveries]);

  const handleStartEdit = (item: DeliveryItem) => {
    isEditingRef.current = true; // Pausa o polling
    setEditingId(item.id);
    setEditRecipient(item.recipient_name);
    setEditAddress(item.address || '');
    setEditTrackingCode(item.tracking_code);
    setEditStatus(item.status);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    isEditingRef.current = false; // Retoma o polling
  };

  const handleSaveEdit = async (id: string) => {
    try {
      const res = await fetch(`/api/deliveries/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient_name: editRecipient,
          address: editAddress,
          tracking_code: editTrackingCode,
          status: editStatus,
        }),
      });

      if (res.ok) {
        setEditingId(null);
        isEditingRef.current = false; // Retoma o polling
        fetchDeliveries(true); // Força atualização pós-salvamento
      } else {
        alert('Erro ao atualizar entrega.');
      }
    } catch {
      alert('Erro de conexão ao salvar alterações.');
    }
  };

  const handleQuickStatusChange = async (id: string, newStatus: DeliveryItem['status']) => {
    if (isEditingRef.current) return; // Segurança extra

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
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Painel do Supervisor