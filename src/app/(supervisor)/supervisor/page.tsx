'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Shield,
  Loader2,
  Edit3,
  Check,
  X,
  Phone,
  MessageSquare,
  DollarSign,
  Trash2,
  Download,
  LogOut,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import UserManagement from '@/components/supervisor/UserManagement';
import ClientManagement from '@/components/supervisor/ClientManagement';
import PushNotificationButton from '@/components/PushNotificationButton';

interface Courier {
  id: string;
  name: string;
  username: string;
}

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
  courier_id?: string | null;
  courier_name?: string | null;
}

interface EarningRecord {
  id: string;
  tracking_code: string;
  status: 'DELIVERED';
  delivery_fee: number | null;
  created_at: string;
  completion_notes?: string | null;
}

export default function SupervisorPage() {
  const router = useRouter();
  const [deliveries, setDeliveries] = useState<DeliveryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUserManagementOpen, setIsUserManagementOpen] = useState(false);
  const [isClientManagementOpen, setIsClientManagementOpen] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [couriers, setCouriers] = useState<Courier[]>([]);
  const [isLoadingCouriers, setIsLoadingCouriers] = useState(true);
  const [filterFrom, setFilterFrom] = useState(() => {
    const today = new Date();

    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  });

  const [filterTo, setFilterTo] = useState(() => {
    const today = new Date();

    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  });
  const [activeQuickFilter, setActiveQuickFilter] = useState('today');
  const [isEarningsOpen, setIsEarningsOpen] = useState(false);

  // Estados dos ganhos dos entregadores
  const [selectedEarningsCourierId, setSelectedEarningsCourierId] =
    useState('');
  const [earnings, setEarnings] = useState<EarningRecord[]>([]);
  const [isLoadingEarnings, setIsLoadingEarnings] = useState(false);
  const [earningsError, setEarningsError] = useState('');
  const [earningsFilterFrom, setEarningsFilterFrom] = useState('');
  const [earningsFilterTo, setEarningsFilterTo] = useState('');
  const [activeEarningsQuickFilter, setActiveEarningsQuickFilter] =
    useState('today');

  // Ref para controlar se estamos editando
  // Evita atualização automática durante a edição.
  const isEditingRef = useRef(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Estados para o formulário de edição
  const [editRecipient, setEditRecipient] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editLatitude, setEditLatitude] = useState<number | null>(null);
  const [editLongitude, setEditLongitude] = useState<number | null>(null);
  const [editTrackingCode, setEditTrackingCode] = useState('');
  const [editStatus, setEditStatus] =
    useState<DeliveryItem['status']>('PENDING');
  const [editPhone, setEditPhone] = useState('');
  const [editDeliveryFee, setEditDeliveryFee] = useState('');
  const [editCourierId, setEditCourierId] = useState('');

  const applyQuickFilter = (filter: string) => {
    const today = new Date();

    const formatDate = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');

      return `${year}-${month}-${day}`;
    };

    const todayFormatted = formatDate(today);

    if (filter === 'today') {
      setFilterFrom(todayFormatted);
      setFilterTo(todayFormatted);
    }

    if (filter === 'yesterday') {
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);

      const yesterdayFormatted = formatDate(yesterday);

      setFilterFrom(yesterdayFormatted);
      setFilterTo(yesterdayFormatted);
    }

    if (filter === 'last7') {
      const startDate = new Date(today);
      startDate.setDate(today.getDate() - 6);

      setFilterFrom(formatDate(startDate));
      setFilterTo(todayFormatted);
    }

    if (filter === 'month') {
      const startOfMonth = new Date(
        today.getFullYear(),
        today.getMonth(),
        1
      );

      setFilterFrom(formatDate(startOfMonth));
      setFilterTo(todayFormatted);
    }

    if (filter === 'all') {
      setFilterFrom('');
      setFilterTo('');
    }

    setActiveQuickFilter(filter);
  };

  const applyEarningsQuickFilter = (filter: string) => {
    const today = new Date();

    const formatDate = (date: Date) => {
      const year = date.getFullYear();
      const month = String(
        date.getMonth() + 1
      ).padStart(2, '0');
      const day = String(
        date.getDate()
      ).padStart(2, '0');

      return `${year}-${month}-${day}`;
    };

    const todayFormatted = formatDate(today);

    if (filter === 'today') {
      setEarningsFilterFrom(todayFormatted);
      setEarningsFilterTo(todayFormatted);
    }

    if (filter === 'yesterday') {
      const yesterday = new Date(today);

      yesterday.setDate(
        today.getDate() - 1
      );

      const yesterdayFormatted =
        formatDate(yesterday);

      setEarningsFilterFrom(
        yesterdayFormatted
      );

      setEarningsFilterTo(
        yesterdayFormatted
      );
    }

    if (filter === 'last7') {
      const startDate = new Date(today);

      startDate.setDate(
        today.getDate() - 6
      );

      setEarningsFilterFrom(
        formatDate(startDate)
      );

      setEarningsFilterTo(
        todayFormatted
      );
    }

    if (filter === 'month') {
      const startOfMonth = new Date(
        today.getFullYear(),
        today.getMonth(),
        1
      );

      setEarningsFilterFrom(
        formatDate(startOfMonth)
      );

      setEarningsFilterTo(
        todayFormatted
      );
    }

    if (filter === 'all') {
      setEarningsFilterFrom('');
      setEarningsFilterTo('');
    }

    setActiveEarningsQuickFilter(filter);
  };

  const fetchEarnings = useCallback(async () => {

    if (!selectedEarningsCourierId) {
      setEarnings([]);
      return;
    }

    setIsLoadingEarnings(true);
    setEarningsError('');

    try {
      const params = new URLSearchParams();

      params.set(
        'courier_id',
        selectedEarningsCourierId
      );

      if (earningsFilterFrom) {
        params.set('from', earningsFilterFrom);
      }

      if (earningsFilterTo) {
        params.set('to', earningsFilterTo);
      }

      const res = await fetch(
        `/api/earnings?${params.toString()}`,
        {
          cache: 'no-store',
        }
      );

      const data = await res.json();


      if (!res.ok) {
        throw new Error(
          data?.error || 'Erro ao buscar ganhos.'
        );
      }

      setEarnings(data);
    } catch (error) {
      console.error(
        'Erro ao carregar ganhos:',
        error
      );

      setEarnings([]);
      setEarningsError(
        'Não foi possível carregar os ganhos.'
      );
    } finally {
      setIsLoadingEarnings(false);
    }
  }, [
    selectedEarningsCourierId,
    earningsFilterFrom,
    earningsFilterTo,
  ]);

  const totalEarnings = earnings.reduce(
    (total, item) =>
      total + Number(item.delivery_fee || 0),
    0
  );

  const fetchDeliveries = useCallback(
    async (isSilent = false) => {
      if (isEditingRef.current) return;

      if (!isSilent) setIsLoading(true);

      try {
        const params = new URLSearchParams();

        if (filterFrom) {
          params.set('from', filterFrom);
        }

        if (filterTo) {
          params.set('to', filterTo);
        }

        const query = params.toString();

        const res = await fetch(
          `/api/deliveries${query ? `?${query}` : ''}`,
          {
            cache: 'no-store',
          }
        );

        if (res.ok) {
          const data = await res.json();
          setDeliveries(data);
        }
      } catch (error) {
        console.error(
          'Erro ao carregar entregas no supervisor:',
          error
        );
      } finally {
        if (!isSilent) setIsLoading(false);
      }
    },
    [filterFrom, filterTo]
  );

  useEffect(() => {
    applyQuickFilter('today');
  }, []);

  useEffect(() => {
    applyEarningsQuickFilter('today');
  }, []);

  // ============================================================
  // BUSCAR ENTREGAS INICIALMENTE / QUANDO O FILTRO MUDA
  // ============================================================

  useEffect(() => {
    fetchDeliveries();
  }, [fetchDeliveries]);

  useEffect(() => {
    fetchEarnings();
  }, [fetchEarnings]);

  // ============================================================
  // SINCRONIZAÇÃO VIA PUSH
  // ============================================================

  useEffect(() => {
    const handleServiceWorkerMessage = (
      event: MessageEvent
    ) => {
      if (
        event.data?.type !== 'DATA_CHANGED' &&
        event.data?.type !== 'NEW_DELIVERY'
      ) {
        return;
      }

      console.log(
        '[Rotix] Evento de sincronização recebido:',
        event.data
      );



      /*
       * O Push apenas dispara uma nova busca.
       *
       * A API continua sendo a fonte oficial dos dados.
       *
       * Os filtros atuais são preservados porque
       * fetchDeliveries utiliza filterFrom/filterTo.
       */
      fetchDeliveries(true);
      fetchEarnings();
    };

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener(
        'message',
        handleServiceWorkerMessage
      );
    }

    return () => {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener(
          'message',
          handleServiceWorkerMessage
        );
      }
    };
  }, [fetchDeliveries, fetchEarnings]);

  // ============================================================
  // CARREGAR ENTREGADORES
  // ============================================================

  useEffect(() => {
    const fetchCouriers = async () => {
      try {
        const res = await fetch('/api/users/couriers', {
          cache: 'no-store',
        });

        if (res.ok) {
          const data = await res.json();

          setCouriers(data);

          if (data.length > 0) {
            setSelectedEarningsCourierId(
              (current: string) =>
                current || data[0].id
            );
          }
        }
      } catch (error) {
        console.error(
          'Erro ao buscar entregadores:',
          error
        );
      } finally {
        setIsLoadingCouriers(false);
      }
    };

    fetchCouriers();
  }, []);

  // ============================================================
  // EXPORTAR HISTÓRICO
  // ============================================================

  const handleExportTxt = async () => {
    try {
      setIsExporting(true);

      const res = await fetch(
        '/api/supervisor/data'
      );

      if (!res.ok) {
        throw new Error('Falha ao exportar');
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');

      a.href = url;
      a.download = `historico-entregas-${new Date()
        .toISOString()
        .slice(0, 10)}.txt`;

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

  // ============================================================
  // APAGAR DADOS
  // ============================================================

  const handleClearData = async () => {
    const confirmation = window.confirm(
      'ATENÇÃO: Tem certeza que deseja apagar todos os dados operacionais? Esta ação não pode ser desfeita.'
    );

    if (!confirmation) return;

    try {
      setIsClearing(true);

      const res = await fetch(
        '/api/supervisor/data',
        {
          method: 'DELETE',
        }
      );

      if (res.ok) {
        alert(
          'Dados operacionais apagados com sucesso!'
        );

        fetchDeliveries(true);
      } else {
        alert('Erro ao apagar os dados.');
      }
    } catch (error) {
      alert(
        'Erro de rede ao tentar limpar os dados.'
      );
    } finally {
      setIsClearing(false);
    }
  };

  // ============================================================
  // ALTERAÇÃO DE ENDEREÇO
  // ============================================================

  const handleAddressChange = (
    value: string
  ) => {
    setEditAddress(value);
    setEditLatitude(null);
    setEditLongitude(null);
  };

  // ============================================================
  // INICIAR EDIÇÃO
  // ============================================================

  const handleStartEdit = (
    item: DeliveryItem
  ) => {
    isEditingRef.current = true;

    setEditingId(item.id);
    setEditRecipient(
      item.recipient_name
    );
    setEditAddress(
      item.address || ''
    );
    setEditLatitude(
      item.lat ?? null
    );
    setEditLongitude(
      item.lng ?? null
    );
    setEditTrackingCode(
      item.tracking_code
    );
    setEditStatus(item.status);
    setEditPhone(
      item.phone || ''
    );

    setEditDeliveryFee(
      item.delivery_fee !== undefined &&
        item.delivery_fee !== null
        ? String(item.delivery_fee)
        : ''
    );

    setEditCourierId(
      item.courier_id || ''
    );
  };

  // ============================================================
  // CANCELAR EDIÇÃO
  // ============================================================

  const handleCancelEdit = () => {
    setEditingId(null);
    isEditingRef.current = false;
  };

  // ============================================================
  // SALVAR EDIÇÃO
  // ============================================================

  const handleSaveEdit = async (
    id: string
  ) => {
    try {
      const res = await fetch(
        `/api/deliveries/${id}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            recipient_name: editRecipient,
            address: editAddress,
            latitude: editLatitude,
            longitude: editLongitude,
            tracking_code: editTrackingCode,
            status: editStatus,
            phone: editPhone,
            delivery_fee:
              editDeliveryFee !== ''
                ? parseFloat(
                  editDeliveryFee
                )
                : 0,
            courier_id:
              editCourierId || null,
          }),
        }
      );

      if (res.ok) {
        setEditingId(null);
        isEditingRef.current = false;

        fetchDeliveries(true);
        fetchEarnings();
      } else {
        alert(
          'Erro ao atualizar entrega.'
        );
      }
    } catch {
      alert(
        'Erro de conexão ao salvar alterações.'
      );
    }
  };

  // ============================================================
  // ALTERAÇÃO RÁPIDA DE STATUS
  // ============================================================

  const handleQuickStatusChange = async (
    id: string,
    newStatus: DeliveryItem['status']
  ) => {
    if (isEditingRef.current) return;

    try {
      const res = await fetch(
        `/api/deliveries/${id}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            status: newStatus,
          }),
        }
      );

      if (res.ok) {
        fetchDeliveries(true);
        fetchEarnings();
      } else {
        alert(
          'Erro ao atualizar status.'
        );
      }
    } catch {
      alert(
        'Erro de conexão.'
      );
    }
  };

  // ============================================================
  // LOGOUT
  // ============================================================

  const handleLogout = async () => {
    try {
      await fetch(
        '/api/auth/logout',
        {
          method: 'POST',
        }
      );
    } finally {
      router.push('/login');
      router.refresh();
    }
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* =====================================================
            CABEÇALHO
        ====================================================== */}

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

              <p className="text-xs text-slate-500">
                Gerenciamento global e edição total das ordens de entrega
              </p>
            </div>

          </div>

          <div className="flex items-center gap-2 flex-wrap justify-end">

            <PushNotificationButton />

            <button
              onClick={handleExportTxt}
              disabled={isExporting}
              className="px-3 py-2 bg-[#002B5C] hover:bg-[#00234D] text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition shadow-sm disabled:opacity-50"
            >
              {isExporting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}

              <span>
                Salvar Histórico (.txt)
              </span>
            </button>

            <button
              onClick={handleClearData}
              disabled={isClearing}
              className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-bold text-xs rounded-xl flex items-center gap-1.5 transition disabled:opacity-50"
            >
              {isClearing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}

              <span>
                Apagar Dados
              </span>
            </button>

            <button
              type="button"
              onClick={() =>
                router.push('/operator')
              }
              className="px-3 py-2 bg-[#002B5C] hover:bg-[#00234D] text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition shadow-sm"
            >
              <Shield className="h-4 w-4" />

              <span>
                Tela do Operador
              </span>
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="px-3 py-2 bg-slate-100 hover:bg-[#002B5C] text-slate-600 hover:text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition"
            >
              <LogOut className="h-4 w-4" />

              <span>
                Sair
              </span>
            </button>

          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <button
            type="button"
            onClick={() =>
              setIsUserManagementOpen((prev) => !prev)
            }
            className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 transition"
          >
            <div className="flex items-center gap-2">
              {isUserManagementOpen ? (
                <ChevronDown className="h-4 w-4 text-[#002B5C]" />
              ) : (
                <ChevronRight className="h-4 w-4 text-[#002B5C]" />
              )}

              <span className="font-bold text-xs text-slate-800 uppercase tracking-wider">
                Cadastro de Usuário
              </span>
            </div>
          </button>

          {isUserManagementOpen && (
            <div className="border-t border-slate-100">
              <UserManagement />
            </div>
          )}
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <button
            type="button"
            onClick={() =>
              setIsClientManagementOpen((prev) => !prev)
            }
            className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 transition"
          >
            <div className="flex items-center gap-2">
              {isClientManagementOpen ? (
                <ChevronDown className="h-4 w-4 text-[#002B5C]" />
              ) : (
                <ChevronRight className="h-4 w-4 text-[#002B5C]" />
              )}

              <span className="font-bold text-xs text-slate-800 uppercase tracking-wider">
                Clientes
              </span>
            </div>
          </button>

          {isClientManagementOpen && (
            <div className="border-t border-slate-100">
              <ClientManagement />
            </div>
          )}
        </div>

        <div className="mt-6 rounded-xl border bg-white shadow-sm overflow-hidden">
          <button
            type="button"
            onClick={() =>
              setIsEarningsOpen((prev) => !prev)
            }
            className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 transition"
          >
            <div className="flex items-center gap-2">
              {isEarningsOpen ? (
                <ChevronDown className="h-5 w-5 text-[#002B5C]" />
              ) : (
                <ChevronRight className="h-5 w-5 text-[#002B5C]" />
              )}

              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-[#002B5C]" />

                <h2 className="text-xl font-semibold text-[#002B5C]">
                  Ganhos dos Entregadores
                </h2>
              </div>
            </div>
          </button>

          {isEarningsOpen && (
            <div className="border-t border-slate-100 p-6">

              <div className="mb-4">
                <label className="mb-1 block text-sm font-medium text-gray-900">
                  Entregador
                </label>

                <select
                  value={selectedEarningsCourierId}
                  onChange={(e) =>
                    setSelectedEarningsCourierId(e.target.value)
                  }
                  className="w-full rounded-lg border px-3 py-2 text-gray-900"
                  disabled={isLoadingCouriers}
                >
                  <option value="" className="text-gray-900">
                    {isLoadingCouriers
                      ? 'Carregando entregadores...'
                      : 'Selecione um entregador'}
                  </option>

                  {couriers.map((courier) => (
                    <option
                      key={courier.id}
                      value={courier.id}
                      className="text-gray-900"
                    >
                      {courier.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mb-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => applyEarningsQuickFilter('today')}
                  className={`rounded-lg px-3 py-2 text-sm text-gray-900 ${activeEarningsQuickFilter === 'today'
                    ? 'bg-blue-600 text-white'
                    : 'border bg-white'
                    }`}
                >
                  Hoje
                </button>

                <button
                  type="button"
                  onClick={() => applyEarningsQuickFilter('yesterday')}
                  className={`rounded-lg px-3 py-2 text-sm text-gray-900 ${activeEarningsQuickFilter === 'yesterday'
                    ? 'bg-blue-600 text-white'
                    : 'border bg-white'
                    }`}
                >
                  Ontem
                </button>

                <button
                  type="button"
                  onClick={() => applyEarningsQuickFilter('last7')}
                  className={`rounded-lg px-3 py-2 text-sm text-gray-900 ${activeEarningsQuickFilter === 'last7'
                    ? 'bg-blue-600 text-white'
                    : 'border bg-white'
                    }`}
                >
                  Últimos 7 dias
                </button>

                <button
                  type="button"
                  onClick={() => applyEarningsQuickFilter('month')}
                  className={`rounded-lg px-3 py-2 text-sm text-gray-900 ${activeEarningsQuickFilter === 'month'
                    ? 'bg-blue-600 text-white'
                    : 'border bg-white'
                    }`}
                >
                  Este mês
                </button>

                <button
                  type="button"
                  onClick={() => applyEarningsQuickFilter('all')}
                  className={`rounded-lg px-3 py-2 text-sm text-gray-900 ${activeEarningsQuickFilter === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'border bg-white'
                    }`}
                >
                  Todos
                </button>
              </div>

              <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-900">
                    De
                  </label>

                  <input
                    type="date"
                    value={earningsFilterFrom}
                    onChange={(e) => {
                      setEarningsFilterFrom(e.target.value);
                      setActiveEarningsQuickFilter('');
                    }}
                    className="w-full rounded-lg border px-3 py-2 text-gray-900"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-900">
                    Até
                  </label>

                  <input
                    type="date"
                    value={earningsFilterTo}
                    onChange={(e) => {
                      setEarningsFilterTo(e.target.value);
                      setActiveEarningsQuickFilter('');
                    }}
                    className="w-full rounded-lg border px-3 py-2 text-gray-900"
                  />
                </div>
              </div>

              <div className="mb-4 rounded-lg border p-4">
                <div className="text-sm text-gray-700">
                  <div className="mb-1 font-semibold text-gray-900">
                    {couriers.find(
                      (courier) =>
                        courier.id === selectedEarningsCourierId
                    )?.name || 'Entregador'}
                  </div>
                  Total Acumulado
                </div>

                <div className="mt-1 text-2xl font-bold text-gray-900">
                  R$ {totalEarnings.toFixed(2).replace('.', ',')}
                </div>
              </div>

              <div className="space-y-3">
                {isLoadingEarnings && (
                  <div className="flex items-center gap-2 py-4 text-sm text-gray-700">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Carregando ganhos...
                  </div>
                )}

                {!isLoadingEarnings && earningsError && (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">
                    {earningsError}
                  </div>
                )}

                {!isLoadingEarnings &&
                  !earningsError &&
                  selectedEarningsCourierId &&
                  earnings.length === 0 && (
                    <div className="rounded-lg border p-4 text-sm text-gray-700">
                      Nenhum ganho encontrado para o período selecionado.
                    </div>
                  )}

                {!isLoadingEarnings &&
                  !earningsError &&
                  earnings.length > 0 &&
                  earnings.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded-lg border p-4"
                    >
                      <div>
                        <div className="font-medium text-gray-900">
                          {item.tracking_code}
                        </div>

                        <div className="text-sm text-gray-700">
                          {item.created_at}
                        </div>
                      </div>

                      <div className="font-semibold text-gray-900">
                        + R$ {Number(item.delivery_fee || 0)
                          .toFixed(2)
                          .replace('.', ',')}
                      </div>
                    </div>
                  ))}
              </div>

            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">

          <div className="p-4 border-b border-slate-100">

            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">

              <div>
                <h2 className="font-bold text-xs text-slate-700 uppercase tracking-wider">
                  Ordens Registradas ({deliveries.length})
                </h2>

                <p className="text-[11px] text-slate-400 mt-1">
                  Consulte as entregas por período
                </p>
              </div>

              <div className="flex flex-col gap-2">

                {/* Filtros rápidos */}

                <div className="flex flex-wrap gap-2">

                  <button
                    type="button"
                    onClick={() =>
                      applyQuickFilter(
                        'today'
                      )
                    }
                    className={`px-3 py-2 text-xs font-semibold rounded-lg transition ${activeQuickFilter ===
                      'today'
                      ? 'bg-[#002B5C] text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                  >
                    Hoje
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      applyQuickFilter(
                        'yesterday'
                      )
                    }
                    className={`px-3 py-2 text-xs font-semibold rounded-lg transition ${activeQuickFilter ===
                      'yesterday'
                      ? 'bg-[#002B5C] text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                  >
                    Ontem
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      applyQuickFilter(
                        'last7'
                      )
                    }
                    className={`px-3 py-2 text-xs font-semibold rounded-lg transition ${activeQuickFilter ===
                      'last7'
                      ? 'bg-[#002B5C] text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                  >
                    Últimos 7 dias
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      applyQuickFilter(
                        'month'
                      )
                    }
                    className={`px-3 py-2 text-xs font-semibold rounded-lg transition ${activeQuickFilter ===
                      'month'
                      ? 'bg-[#002B5C] text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                  >
                    Este mês
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      applyQuickFilter(
                        'all'
                      )
                    }
                    className={`px-3 py-2 text-xs font-semibold rounded-lg transition ${activeQuickFilter ===
                      'all'
                      ? 'bg-[#002B5C] text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                  >
                    Todos
                  </button>

                </div>

                {/* Datas manuais */}

                <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-2">

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                      Data inicial
                    </label>

                    <input
                      type="date"
                      value={filterFrom}
                      onChange={(e) => {
                        setFilterFrom(
                          e.target.value
                        );
                        setActiveQuickFilter(
                          ''
                        );
                      }}
                      className="text-xs border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#FF6600]/30 focus:border-[#FF6600]"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                      Data final
                    </label>

                    <input
                      type="date"
                      value={filterTo}
                      onChange={(e) => {
                        setFilterTo(
                          e.target.value
                        );
                        setActiveQuickFilter(
                          ''
                        );
                      }}
                      className="text-xs border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#FF6600]/30 focus:border-[#FF6600]"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setFilterFrom('');
                      setFilterTo('');
                      setActiveQuickFilter(
                        'all'
                      );
                    }}
                    className="h-[34px] px-3 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
                  >
                    Limpar
                  </button>

                </div>

              </div>

            </div>
          </div>

          {isLoading ? (
            <div className="p-8 flex items-center justify-center text-slate-400 text-xs gap-2">

              <Loader2 className="h-5 w-5 animate-spin text-[#002B5C]" />

              <span>
                Carregando dados do banco...
              </span>

            </div>
          ) : deliveries.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              Nenhuma ordem encontrada no banco.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">

              {deliveries.map(
                (item) => {
                  const isEditing =
                    editingId === item.id;

                  return (
                    <div
                      key={item.id}
                      className="p-4 hover:bg-slate-50 transition"
                    >

                      {isEditing ? (
                        <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">

                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-3">

                            <div>
                              <label className="text-[10px] font-bold text-slate-500 uppercase">
                                Cód. Rastreio
                              </label>

                              <input
                                type="text"
                                value={
                                  editTrackingCode
                                }
                                onChange={(e) =>
                                  setEditTrackingCode(
                                    e.target.value
                                  )
                                }
                                className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FF6600]/30 focus:border-[#FF6600]"
                              />
                            </div>

                            <div>
                              <label className="text-[10px] font-bold text-slate-500 uppercase">
                                Destinatário
                              </label>

                              <input
                                type="text"
                                value={
                                  editRecipient
                                }
                                onChange={(e) =>
                                  setEditRecipient(
                                    e.target.value
                                  )
                                }
                                className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FF6600]/30 focus:border-[#FF6600]"
                              />
                            </div>

                            <div>
                              <label className="text-[10px] font-bold text-slate-500 uppercase">
                                Telefone / WhatsApp
                              </label>

                              <input
                                type="text"
                                value={
                                  editPhone
                                }
                                onChange={(e) =>
                                  setEditPhone(
                                    e.target.value
                                  )
                                }
                                placeholder="(00) 00000-0000"
                                className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FF6600]/30 focus:border-[#FF6600]"
                              />
                            </div>

                            <div>
                              <label className="text-[10px] font-bold text-slate-500 uppercase">
                                Valor da Entrega (R$)
                              </label>

                              <input
                                type="number"
                                step="0.01"
                                value={
                                  editDeliveryFee
                                }
                                onChange={(e) =>
                                  setEditDeliveryFee(
                                    e.target.value
                                  )
                                }
                                placeholder="0.00"
                                className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FF6600]/30 focus:border-[#FF6600]"
                              />
                            </div>

                            <div>
                              <label className="text-[10px] font-bold text-slate-500 uppercase">
                                Entregador
                              </label>

                              <select
                                value={
                                  editCourierId
                                }
                                onChange={(e) =>
                                  setEditCourierId(
                                    e.target.value
                                  )
                                }
                                className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FF6600]/30 focus:border-[#FF6600]"
                              >
                                <option value="">
                                  Sem entregador
                                </option>

                                {couriers.map(
                                  (
                                    courier
                                  ) => (
                                    <option
                                      key={
                                        courier.id
                                      }
                                      value={
                                        courier.id
                                      }
                                    >
                                      {
                                        courier.name
                                      }{' '}
                                      (
                                      {
                                        courier.username
                                      }
                                      )
                                    </option>
                                  )
                                )}
                              </select>
                            </div>

                            <div>
                              <label className="text-[10px] font-bold text-slate-500 uppercase">
                                Status
                              </label>

                              <select
                                value={
                                  editStatus
                                }
                                onChange={(e) =>
                                  setEditStatus(
                                    e.target.value as DeliveryItem['status']
                                  )
                                }
                                className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FF6600]/30 focus:border-[#FF6600]"
                              >
                                <option value="PENDING">
                                  Pendente
                                </option>

                                <option value="IN_TRANSIT">
                                  Em transito
                                </option>

                                <option value="DELIVERED">
                                  Entregue
                                </option>

                                <option value="CANCELLED">
                                  Cancelado
                                </option>
                              </select>
                            </div>

                          </div>

                          <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase">
                              Endereço (Texto Livre)
                            </label>

                            <input
                              type="text"
                              value={
                                editAddress
                              }
                              onChange={(e) =>
                                handleAddressChange(
                                  e.target.value
                                )
                              }
                              className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FF6600]/30 focus:border-[#FF6600]"
                              placeholder="Digite o endereço..."
                            />
                          </div>

                          <div className="flex justify-end gap-2 pt-2">

                            <button
                              onClick={
                                handleCancelEdit
                              }
                              className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-300 rounded-lg flex items-center gap-1 hover:bg-slate-100"
                            >
                              <X className="h-3.5 w-3.5" />

                              Cancelar
                            </button>

                            <button
                              onClick={() =>
                                handleSaveEdit(
                                  item.id
                                )
                              }
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
                                {
                                  item.tracking_code
                                }
                              </span>

                              <span className="text-xs font-bold text-slate-900">
                                {
                                  item.recipient_name
                                }
                              </span>

                              {item.courier_name && (
                                <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                                  Entregador:{' '}
                                  {
                                    item.courier_name
                                  }
                                </span>
                              )}

                              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md flex items-center gap-0.5 border border-emerald-100">

                                <DollarSign className="h-3 w-3" />

                                {Number(
                                  item.delivery_fee ||
                                  0
                                ).toFixed(2)}

                              </span>

                              {item.completion_notes && (
                                <span className="text-[11px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded italic">
                                  Obs/Recebedor:{' '}
                                  {
                                    item.completion_notes
                                  }
                                </span>
                              )}

                            </div>

                            <p className="text-xs text-slate-500">
                              {item.address ||
                                'Sem endereço informado'}
                            </p>

                            {item.phone && (
                              <div className="flex items-center gap-3 pt-1">

                                <span className="text-[11px] text-slate-600 font-medium">
                                  Tel:{' '}
                                  {item.phone}
                                </span>

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
                              value={
                                item.status
                              }
                              onChange={(e) =>
                                handleQuickStatusChange(
                                  item.id,
                                  e.target.value as DeliveryItem['status']
                                )
                              }
                              className="text-xs border border-slate-300 rounded-xl px-3 py-1.5 bg-slate-50 font-medium text-slate-700 outline-none focus:ring-2 focus:ring-[#FF6600]/30 focus:border-[#FF6600]"
                            >
                              <option value="PENDING">
                                Pendente
                              </option>

                              <option value="IN_TRANSIT">
                                Em transito
                              </option>

                              <option value="DELIVERED">
                                Entregue
                              </option>

                              <option value="CANCELLED">
                                Cancelado
                              </option>
                            </select>

                            <button
                              onClick={() =>
                                handleStartEdit(
                                  item
                                )
                              }
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
                }
              )}

            </div>
          )}

        </div>

      </div>
    </div>
  );
}