'use client';

import {
  useState,
  useEffect,
  useRef,
  useCallback,
} from 'react';

import {
  PackagePlus,
  Loader2,
  MapPin,
  CheckCircle2,
  RefreshCw,
  Phone,
  MessageSquare,
  DollarSign,
  LogOut,
  Shield,
  Edit3,
  Check,
  X,
} from 'lucide-react';

import { useRouter } from 'next/navigation';

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

interface Courier {
  id: string;
  name: string;
  username: string;
}

type DeliveryStatus =
  | 'PENDING'
  | 'IN_TRANSIT'
  | 'DELIVERED'
  | 'CANCELLED';

interface Delivery {
  id: string;
  tracking_code: string;
  recipient_name: string;
  address: string;
  lat: number | null;
  lng: number | null;
  status: DeliveryStatus;
  phone?: string | null;
  completion_notes?: string | null;
  delivery_fee?: number | null;
  courier_id?: string | null;
  courier_name?: string | null;
  created_at: string;
}

/**
 * Retorna uma data no formato YYYY-MM-DD
 * usando o horário local do navegador.
 */
function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

/**
 * Retorna a data de hoje.
 */
function getToday(): string {
  return formatDate(new Date());
}

export default function OperatorPage() {
  const router = useRouter();

  // ============================================================
  // ESTADOS DO FORMULÁRIO
  // ============================================================

  const [trackingCode, setTrackingCode] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [deliveryFee, setDeliveryFee] = useState('');
  const [courierId, setCourierId] = useState('');

  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);

  // ============================================================
  // ENTREGADORES
  // ============================================================

  const [couriers, setCouriers] = useState<Courier[]>([]);
  const [isLoadingCouriers, setIsLoadingCouriers] = useState(true);

  // ============================================================
  // FILTROS
  // ============================================================

  const [filterFrom, setFilterFrom] = useState(getToday);
  const [filterTo, setFilterTo] = useState(getToday);
  const [activeQuickFilter, setActiveQuickFilter] = useState('today');

  // ============================================================
  // BUSCA DE ENDEREÇO
  // ============================================================

  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);

  // ============================================================
  // CADASTRO
  // ============================================================

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // ============================================================
  // LISTA DE ENTREGAS
  // ============================================================

  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [isLoadingDeliveries, setIsLoadingDeliveries] = useState(true);

  // ============================================================
  // EDIÇÃO
  // ============================================================

  const isEditingRef = useRef(false);

  const [editingId, setEditingId] = useState<string | null>(null);

  const [editRecipient, setEditRecipient] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editLatitude, setEditLatitude] = useState<number | null>(null);
  const [editLongitude, setEditLongitude] = useState<number | null>(null);
  const [editTrackingCode, setEditTrackingCode] = useState('');
  const [editStatus, setEditStatus] =
    useState<DeliveryStatus>('PENDING');
  const [editPhone, setEditPhone] = useState('');
  const [editDeliveryFee, setEditDeliveryFee] = useState('');
  const [editCourierId, setEditCourierId] = useState('');

  // ============================================================
  // FILTROS RÁPIDOS
  // ============================================================

  const applyQuickFilter = useCallback((filter: string) => {
    const today = new Date();
    const todayFormatted = formatDate(today);

    switch (filter) {
      case 'today': {
        setFilterFrom(todayFormatted);
        setFilterTo(todayFormatted);
        break;
      }

      case 'yesterday': {
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        const yesterdayFormatted = formatDate(yesterday);

        setFilterFrom(yesterdayFormatted);
        setFilterTo(yesterdayFormatted);
        break;
      }

      case 'last7': {
        const startDate = new Date(today);
        startDate.setDate(startDate.getDate() - 6);

        setFilterFrom(formatDate(startDate));
        setFilterTo(todayFormatted);
        break;
      }

      case 'month': {
        const startOfMonth = new Date(
          today.getFullYear(),
          today.getMonth(),
          1
        );

        setFilterFrom(formatDate(startOfMonth));
        setFilterTo(todayFormatted);
        break;
      }

      case 'all': {
        setFilterFrom('');
        setFilterTo('');
        break;
      }

      default:
        break;
    }

    setActiveQuickFilter(filter);
  }, []);

  // ============================================================
  // BUSCAR ENTREGAS
  // ============================================================

  const fetchDeliveries = useCallback(
    async (isSilent = false) => {
      // Não atualiza a lista enquanto o usuário está editando.
      if (isEditingRef.current) {
        return;
      }

      if (!isSilent) {
        setIsLoadingDeliveries(true);
      }

      try {
        const params = new URLSearchParams();

        if (filterFrom) {
          params.set('from', filterFrom);
        }

        if (filterTo) {
          params.set('to', filterTo);
        }

        const query = params.toString();

        const response = await fetch(
          `/api/deliveries${query ? `?${query}` : ''}`,
          {
            method: 'GET',
            cache: 'no-store',
          }
        );

        if (!response.ok) {
          console.error(
            'Erro ao buscar entregas:',
            response.status,
            response.statusText
          );

          return;
        }

        const data = await response.json();

        if (Array.isArray(data)) {
          setDeliveries(data);
        } else {
          console.error(
            'Resposta inesperada da API de entregas:',
            data
          );

          setDeliveries([]);
        }
      } catch (error) {
        console.error('Erro ao buscar entregas:', error);
      } finally {
        if (!isSilent) {
          setIsLoadingDeliveries(false);
        }
      }
    },
    [filterFrom, filterTo]
  );

  // ============================================================
  // CARREGAR ENTREGADORES
  // ============================================================

  useEffect(() => {
    let isMounted = true;

    const fetchCouriers = async () => {
      try {
        const response = await fetch('/api/users/couriers', {
          method: 'GET',
          cache: 'no-store',
        });

        if (!response.ok) {
          console.error(
            'Erro ao buscar entregadores:',
            response.status
          );

          return;
        }

        const data = await response.json();

        if (isMounted && Array.isArray(data)) {
          setCouriers(data);
        }
      } catch (error) {
        console.error(
          'Erro ao buscar entregadores:',
          error
        );
      } finally {
        if (isMounted) {
          setIsLoadingCouriers(false);
        }
      }
    };

    fetchCouriers();

    return () => {
      isMounted = false;
    };
  }, []);

  // ============================================================
  // BUSCAR ENTREGAS QUANDO O FILTRO MUDA
  // ============================================================

  useEffect(() => {
    fetchDeliveries();
  }, [fetchDeliveries]);

  // ============================================================
  // POLLING AUTOMÁTICO
  // ============================================================

  useEffect(() => {
    const interval = setInterval(() => {
      fetchDeliveries(true);
    }, 4000);

    return () => {
      clearInterval(interval);
    };
  }, [fetchDeliveries]);

  // ============================================================
  // BUSCA DE ENDEREÇO - NOVA ENTREGA
  // ============================================================

  useEffect(() => {
    if (
      address.trim().length < 3 ||
      latitude !== null
    ) {
      setSuggestions([]);
      return;
    }

    const controller = new AbortController();

    const timer = setTimeout(async () => {
      setIsSearchingAddress(true);

      try {
        const response = await fetch(
          `/api/geocode?q=${encodeURIComponent(address)}`,
          {
            method: 'GET',
            cache: 'no-store',
            signal: controller.signal,
          }
        );

        if (!response.ok) {
          setSuggestions([]);
          return;
        }

        const data = await response.json();

        if (Array.isArray(data)) {
          setSuggestions(data);
        } else {
          setSuggestions([]);
        }
      } catch (error) {
        if (
          error instanceof DOMException &&
          error.name === 'AbortError'
        ) {
          return;
        }

        console.error(
          'Erro ao buscar sugestões:',
          error
        );

        setSuggestions([]);
      } finally {
        setIsSearchingAddress(false);
      }
    }, 500);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [address, latitude]);

  // ============================================================
  // ALTERAÇÃO DE ENDEREÇO - NOVA ENTREGA
  // ============================================================

  const handleAddressChange = (value: string) => {
    setAddress(value);

    // Ao alterar o endereço, as coordenadas anteriores
    // deixam de ser consideradas válidas.
    setLatitude(null);
    setLongitude(null);
  };

  // ============================================================
  // SELECIONAR SUGESTÃO
  // ============================================================

  const handleSelectSuggestion = (
    suggestion: AddressSuggestion
  ) => {
    const addr = suggestion.address;

    if (addr?.road) {
      const street = addr.road;

      const number = addr.house_number
        ? `, ${addr.house_number}`
        : '';

      const neighborhood = addr.suburb
        ? ` - ${addr.suburb}`
        : '';

      const city =
        addr.city ||
        addr.town ||
        addr.municipality;

      const cityText = city
        ? ` (${city})`
        : '';

      const formattedAddress =
        `${street}${number}${neighborhood}${cityText}`;

      setAddress(formattedAddress);
    } else {
      setAddress(suggestion.display_name);
    }

    const parsedLatitude = Number.parseFloat(
      suggestion.lat
    );

    const parsedLongitude = Number.parseFloat(
      suggestion.lon
    );

    setLatitude(
      Number.isFinite(parsedLatitude)
        ? parsedLatitude
        : null
    );

    setLongitude(
      Number.isFinite(parsedLongitude)
        ? parsedLongitude
        : null
    );

    setSuggestions([]);
  };

  // ============================================================
  // CADASTRAR NOVA ENTREGA
  // ============================================================

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!trackingCode.trim()) {
      alert('Informe o código de rastreio.');
      return;
    }

    if (!recipientName.trim()) {
      alert('Informe o nome do destinatário.');
      return;
    }

    setIsSubmitting(true);
    setSuccessMessage('');

    try {
      const response = await fetch(
        '/api/deliveries',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            tracking_code: trackingCode.trim(),
            recipient_name: recipientName.trim(),
            phone: phone.trim(),
            address: address.trim(),
            latitude,
            longitude,
            delivery_fee:
              deliveryFee.trim() !== ''
                ? Number.parseFloat(deliveryFee)
                : 0,
            courier_id: courierId || null,
          }),
        }
      );

      const data = await response
        .json()
        .catch(() => null);

      if (!response.ok) {
        alert(
          `Erro ao criar entrega: ${
            data?.error ||
            'Falha no servidor.'
          }`
        );

        return;
      }

      setSuccessMessage(
        'Entrega cadastrada com sucesso!'
      );

      // Limpar formulário
      setTrackingCode('');
      setRecipientName('');
      setPhone('');
      setAddress('');
      setDeliveryFee('');
      setCourierId('');
      setLatitude(null);
      setLongitude(null);
      setSuggestions([]);

      // Atualizar lista imediatamente.
      await fetchDeliveries(true);

      // Remove mensagem depois de alguns segundos.
      setTimeout(() => {
        setSuccessMessage('');
      }, 4000);
    } catch (error) {
      console.error(
        'Erro ao enviar formulário:',
        error
      );

      alert(
        'Erro de conexão ao criar entrega.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // ============================================================
  // EDIÇÃO DE ENTREGA
  // ============================================================

  const handleAddressEditChange = (
    value: string
  ) => {
    setEditAddress(value);

    // O endereço foi alterado manualmente,
    // então as coordenadas antigas não são mais confiáveis.
    setEditLatitude(null);
    setEditLongitude(null);
  };

  // ============================================================
  // INICIAR EDIÇÃO
  // ============================================================

  const handleStartEdit = (
    item: Delivery
  ) => {
    isEditingRef.current = true;

    setEditingId(item.id);

    setEditRecipient(
      item.recipient_name || ''
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
      item.tracking_code || ''
    );

    setEditStatus(
      item.status
    );

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
    if (!editTrackingCode.trim()) {
      alert(
        'Informe o código de rastreio.'
      );

      return;
    }

    if (!editRecipient.trim()) {
      alert(
        'Informe o nome do destinatário.'
      );

      return;
    }

    try {
      const response = await fetch(
        `/api/deliveries/${id}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            recipient_name:
              editRecipient.trim(),

            address:
              editAddress.trim(),

            latitude:
              editLatitude,

            longitude:
              editLongitude,

            tracking_code:
              editTrackingCode.trim(),

            status:
              editStatus,

            phone:
              editPhone.trim(),

            delivery_fee:
              editDeliveryFee.trim() !== ''
                ? Number.parseFloat(
                    editDeliveryFee
                  )
                : 0,

            courier_id:
              editCourierId || null,
          }),
        }
      );

      const data = await response
        .json()
        .catch(() => null);

      if (!response.ok) {
        alert(
          `Erro ao atualizar entrega${
            data?.error
              ? `: ${data.error}`
              : '.'
          }`
        );

        return;
      }

      setEditingId(null);
      isEditingRef.current = false;

      await fetchDeliveries(true);
    } catch (error) {
      console.error(
        'Erro ao salvar alteração:',
        error
      );

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
    newStatus: DeliveryStatus
  ) => {
    if (isEditingRef.current) {
      return;
    }

    try {
      const response = await fetch(
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

      const data = await response
        .json()
        .catch(() => null);

      if (!response.ok) {
        alert(
          `Erro ao atualizar status${
            data?.error
              ? `: ${data.error}`
              : '.'
          }`
        );

        return;
      }

      await fetchDeliveries(true);
    } catch (error) {
      console.error(
        'Erro ao atualizar status:',
        error
      );

      alert(
        'Erro de conexão ao atualizar status.'
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
    } catch (error) {
      console.error(
        'Erro ao realizar logout:',
        error
      );
    } finally {
      router.push('/login');
      router.refresh();
    }
  };

  // ============================================================
  // PAINEL DE RESUMO
  // ============================================================

  const totalDeliveries =
    deliveries.length;

  const pendingCount =
    deliveries.filter(
      (delivery) =>
        delivery.status === 'PENDING'
    ).length;

  const inTransitCount =
    deliveries.filter(
      (delivery) =>
        delivery.status === 'IN_TRANSIT'
    ).length;

  const deliveredCount =
    deliveries.filter(
      (delivery) =>
        delivery.status === 'DELIVERED'
    ).length;

  // ============================================================
  // BADGE DE STATUS
  // ============================================================

  const getStatusBadge = (
    status: DeliveryStatus
  ) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-[10px] font-bold">
            Pendente
          </span>
        );

      case 'IN_TRANSIT':
        return (
          <span className="px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-[10px] font-bold">
            Em Trânsito
          </span>
        );

      case 'DELIVERED':
        return (
          <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[10px] font-bold">
            Entregue
          </span>
        );

      case 'CANCELLED':
        return (
          <span className="px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-full text-[10px] font-bold">
            Cancelado
          </span>
        );

      default:
        return null;
    }
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* =====================================================
            CABEÇALHO
        ====================================================== */}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">

          <div className="flex items-center gap-3">

            <div className="p-1 bg-white text-white rounded-2xl shadow-md shadow-[#002B5C]/20">
              <img
                src="/ico android.png"
                alt="Rotix"
                className="h-10 w-10 object-contain"
              />
            </div>

            <div>
              <h1 className="text-xl font-black text-slate-900">
                Painel do Operador
              </h1>

              <p className="text-xs text-slate-500">
                Gestão e cadastro de ordens de entrega
              </p>
            </div>

          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">

            <button
              type="button"
              onClick={() =>
                fetchDeliveries()
              }
              className="flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-[#FF6600] bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-xl transition"
            >
              <RefreshCw
                className={`h-4 w-4 ${
                  isLoadingDeliveries
                    ? 'animate-spin'
                    : ''
                }`}
              />

              <span>
                Atualizar Lista
              </span>
            </button>

            <button
              type="button"
              onClick={() =>
                router.push('/supervisor')
              }
              className="flex items-center gap-2 text-xs font-semibold text-white bg-[#002B5C] hover:bg-[#00234D] px-3 py-2 rounded-xl transition"
            >
              <Shield className="h-4 w-4" />

              <span>
                Supervisor
              </span>
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-white bg-slate-100 hover:bg-red-600 px-3 py-2 rounded-xl transition"
            >
              <LogOut className="h-4 w-4" />

              <span>
                Sair
              </span>
            </button>

          </div>
        </div>

        {/* =====================================================
            NOVA ENTREGA
        ====================================================== */}

        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">

          <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-5">

            <PackagePlus className="h-5 w-5 text-[#002B5C]" />

            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Nova Entrega
            </h2>

          </div>

          {successMessage && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl flex items-center gap-2">

              <CheckCircle2 className="h-4 w-4 shrink-0" />

              <span>
                {successMessage}
              </span>

            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          >

            {/* Código */}

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Código de Rastreio *
              </label>

              <input
                type="text"
                required
                placeholder="Ex: TRK-123456"
                value={trackingCode}
                onChange={(event) =>
                  setTrackingCode(
                    event.target.value
                  )
                }
                className="w-full text-xs p-3 border border-slate-300 rounded-xl bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#002B5C]"
              />
            </div>

            {/* Destinatário */}

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Nome do Destinatário *
              </label>

              <input
                type="text"
                required
                placeholder="Ex: João da Silva"
                value={recipientName}
                onChange={(event) =>
                  setRecipientName(
                    event.target.value
                  )
                }
                className="w-full text-xs p-3 border border-slate-300 rounded-xl bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#002B5C]"
              />
            </div>

            {/* Telefone */}

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Telefone / WhatsApp
              </label>

              <input
                type="text"
                placeholder="Ex: (85) 99999-9999"
                value={phone}
                onChange={(event) =>
                  setPhone(
                    event.target.value
                  )
                }
                className="w-full text-xs p-3 border border-slate-300 rounded-xl bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#002B5C]"
              />
            </div>

            {/* Taxa */}

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Valor da Entrega (R$)
              </label>

              <div className="relative">

                <DollarSign className="absolute left-3 top-3 h-4 w-4 text-slate-400" />

                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={deliveryFee}
                  onChange={(event) =>
                    setDeliveryFee(
                      event.target.value
                    )
                  }
                  className="w-full text-xs p-3 pl-9 border border-slate-300 rounded-xl bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#002B5C]"
                />

              </div>
            </div>

            {/* Entregador */}

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Entregador
              </label>

              <select
                value={courierId}
                onChange={(event) =>
                  setCourierId(
                    event.target.value
                  )
                }
                disabled={isLoadingCouriers}
                className="w-full text-xs p-3 border border-slate-300 rounded-xl bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#002B5C] disabled:opacity-50"
              >

                <option value="">
                  {isLoadingCouriers
                    ? 'Carregando entregadores...'
                    : 'Todos os entregadores'}
                </option>

                {!isLoadingCouriers &&
                  couriers.map(
                    (courier) => (
                      <option
                        key={courier.id}
                        value={courier.id}
                      >
                        {courier.name}
                      </option>
                    )
                  )}

              </select>
            </div>

            {/* Endereço */}

            <div className="md:col-span-2 lg:col-span-2 relative">

              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Endereço com Busca GPS
              </label>

              <div className="relative">

                <input
                  type="text"
                  placeholder="Ex: Rua Firmino Rocha Aguiar, 1835 - Fortaleza"
                  value={address}
                  onChange={(event) =>
                    handleAddressChange(
                      event.target.value
                    )
                  }
                  className="w-full text-xs p-3 pr-10 border border-slate-300 rounded-xl bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#002B5C]"
                />

                {isSearchingAddress && (
                  <div className="absolute right-3 top-3">
                    <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                  </div>
                )}

              </div>

              {/* Sugestões */}

              {suggestions.length > 0 && (
                <ul className="absolute z-20 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto divide-y divide-slate-100">

                  {suggestions.map(
                    (item) => (
                      <li
                        key={item.place_id}
                        onClick={() =>
                          handleSelectSuggestion(
                            item
                          )
                        }
                        className="p-3 text-xs text-slate-700 hover:bg-slate-50 cursor-pointer flex items-start gap-2"
                      >

                        <MapPin className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />

                        <span>
                          {item.display_name}
                        </span>

                      </li>
                    )
                  )}

                </ul>
              )}

              {/* Coordenadas */}

              {latitude !== null &&
                longitude !== null && (
                  <div className="mt-2 p-2 bg-slate-100 rounded-lg text-[11px] font-mono text-slate-600 flex items-center gap-1.5">

                    <MapPin className="h-3.5 w-3.5 text-emerald-600" />

                    <span>
                      GPS:{' '}
                      {latitude.toFixed(6)}
                      {', '}
                      {longitude.toFixed(6)}
                    </span>

                  </div>
                )}

            </div>

            {/* Botão */}

            <div className="md:col-span-2 lg:col-span-1 flex items-end">

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-[#002B5C] hover:bg-[#00234D] text-white font-semibold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50"
              >

                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />

                    <span>
                      Salvando...
                    </span>
                  </>
                ) : (
                  <>
                    <PackagePlus className="h-4 w-4" />

                    <span>
                      Criar Ordem de Entrega
                    </span>
                  </>
                )}

              </button>

            </div>

          </form>
        </div>

        {/* =====================================================
            PAINEL DE ORDENS
        ====================================================== */}

        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">

          {/* Cabeçalho */}

          <div className="p-4 border-b border-slate-100">

            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">

              <div>
                <h2 className="font-bold text-xs text-slate-700 uppercase tracking-wider">
                  Ordens Registradas ({totalDeliveries})
                </h2>

                <p className="text-[11px] text-slate-400 mt-1">
                  Consulte as entregas por período
                </p>
              </div>

              {/* FILTROS */}

              <div className="flex flex-col gap-3">

                {/* Filtros rápidos */}

                <div className="flex flex-wrap gap-2">

                  <button
                    type="button"
                    onClick={() =>
                      applyQuickFilter(
                        'today'
                      )
                    }
                    className={`px-3 py-2 text-xs font-semibold rounded-lg transition ${
                      activeQuickFilter ===
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
                    className={`px-3 py-2 text-xs font-semibold rounded-lg transition ${
                      activeQuickFilter ===
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
                    className={`px-3 py-2 text-xs font-semibold rounded-lg transition ${
                      activeQuickFilter ===
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
                    className={`px-3 py-2 text-xs font-semibold rounded-lg transition ${
                      activeQuickFilter ===
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
                    className={`px-3 py-2 text-xs font-semibold rounded-lg transition ${
                      activeQuickFilter ===
                      'all'
                        ? 'bg-[#002B5C] text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Todos
                  </button>

                </div>

                {/* Datas */}

                <div className="flex flex-col sm:flex-row sm:items-end gap-2">

                  <div className="flex flex-col">

                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                      Data inicial
                    </label>

                    <input
                      type="date"
                      value={filterFrom}
                      onChange={(event) => {
                        setFilterFrom(
                          event.target.value
                        );
                        setActiveQuickFilter(
                          ''
                        );
                      }}
                      className="text-xs border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#FF6600]/30 focus:border-[#FF6600]"
                    />

                  </div>

                  <div className="flex flex-col">

                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                      Data final
                    </label>

                    <input
                      type="date"
                      value={filterTo}
                      onChange={(event) => {
                        setFilterTo(
                          event.target.value
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
                    onClick={() =>
                      applyQuickFilter(
                        'all'
                      )
                    }
                    className="h-[34px] px-3 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
                  >
                    Limpar
                  </button>

                </div>

              </div>

            </div>

          </div>

          {/* ===================================================
              RESUMO
          ==================================================== */}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 border-b border-slate-100">

            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase">
                Total
              </p>

              <p className="text-xl font-black text-slate-900 mt-1">
                {totalDeliveries}
              </p>
            </div>

            <div className="bg-amber-50 rounded-xl p-3 border border-amber-100">
              <p className="text-[10px] font-bold text-amber-600 uppercase">
                Pendentes
              </p>

              <p className="text-xl font-black text-amber-700 mt-1">
                {pendingCount}
              </p>
            </div>

            <div className="bg-blue-50 rounded-xl p-3 border border-blue-100">
              <p className="text-[10px] font-bold text-blue-600 uppercase">
                Em Trânsito
              </p>

              <p className="text-xl font-black text-blue-700 mt-1">
                {inTransitCount}
              </p>
            </div>

            <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100">
              <p className="text-[10px] font-bold text-emerald-600 uppercase">
                Entregues
              </p>

              <p className="text-xl font-black text-emerald-700 mt-1">
                {deliveredCount}
              </p>
            </div>

          </div>

          {/* ===================================================
              CARREGANDO
          ==================================================== */}

          {isLoadingDeliveries ? (
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
                        /* =================================================
                           MODO EDIÇÃO
                        ================================================== */

                        <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">

                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-3">

                            {/* Código */}

                            <div>
                              <label className="text-[10px] font-bold text-slate-500 uppercase">
                                Cód. Rastreio
                              </label>

                              <input
                                type="text"
                                value={
                                  editTrackingCode
                                }
                                onChange={(event) =>
                                  setEditTrackingCode(
                                    event.target.value
                                  )
                                }
                                className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FF6600]/30 focus:border-[#FF6600]"
                              />
                            </div>

                            {/* Destinatário */}

                            <div>
                              <label className="text-[10px] font-bold text-slate-500 uppercase">
                                Destinatário
                              </label>

                              <input
                                type="text"
                                value={
                                  editRecipient
                                }
                                onChange={(event) =>
                                  setEditRecipient(
                                    event.target.value
                                  )
                                }
                                className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FF6600]/30 focus:border-[#FF6600]"
                              />
                            </div>

                            {/* Telefone */}

                            <div>
                              <label className="text-[10px] font-bold text-slate-500 uppercase">
                                Telefone / WhatsApp
                              </label>

                              <input
                                type="text"
                                value={
                                  editPhone
                                }
                                onChange={(event) =>
                                  setEditPhone(
                                    event.target.value
                                  )
                                }
                                placeholder="(00) 00000-0000"
                                className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FF6600]/30 focus:border-[#FF6600]"
                              />
                            </div>

                            {/* Taxa */}

                            <div>
                              <label className="text-[10px] font-bold text-slate-500 uppercase">
                                Valor da Entrega (R$)
                              </label>

                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={
                                  editDeliveryFee
                                }
                                onChange={(event) =>
                                  setEditDeliveryFee(
                                    event.target.value
                                  )
                                }
                                placeholder="0.00"
                                className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FF6600]/30 focus:border-[#FF6600]"
                              />
                            </div>

                            {/* Entregador */}

                            <div>
                              <label className="text-[10px] font-bold text-slate-500 uppercase">
                                Entregador
                              </label>

                              <select
                                value={
                                  editCourierId
                                }
                                onChange={(event) =>
                                  setEditCourierId(
                                    event.target.value
                                  )
                                }
                                className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FF6600]/30 focus:border-[#FF6600]"
                              >

                                <option value="">
                                  Sem entregador
                                </option>

                                {couriers.map(
                                  (courier) => (
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

                            {/* Status */}

                            <div>
                              <label className="text-[10px] font-bold text-slate-500 uppercase">
                                Status
                              </label>

                              <select
                                value={
                                  editStatus
                                }
                                onChange={(event) =>
                                  setEditStatus(
                                    event.target.value as DeliveryStatus
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

                          {/* Endereço */}

                          <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase">
                              Endereço
                            </label>

                            <input
                              type="text"
                              value={
                                editAddress
                              }
                              onChange={(event) =>
                                handleAddressEditChange(
                                  event.target.value
                                )
                              }
                              className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FF6600]/30 focus:border-[#FF6600]"
                              placeholder="Digite o endereço..."
                            />
                          </div>

                          {/* Botões */}

                          <div className="flex justify-end gap-2 pt-2">

                            <button
                              type="button"
                              onClick={
                                handleCancelEdit
                              }
                              className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-300 rounded-lg flex items-center gap-1 hover:bg-slate-100"
                            >
                              <X className="h-3.5 w-3.5" />

                              Cancelar
                            </button>

                            <button
                              type="button"
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
                        /* =================================================
                           MODO NORMAL
                        ================================================== */

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">

                          <div className="space-y-1">

                            <div className="flex items-center gap-2 flex-wrap">

                              {/* Código */}

                              <span className="font-mono font-bold text-xs bg-slate-100 text-slate-800 px-2 py-0.5 rounded">
                                {
                                  item.tracking_code
                                }
                              </span>

                              {/* Destinatário */}

                              <span className="text-xs font-bold text-slate-900">
                                {
                                  item.recipient_name
                                }
                              </span>

                              {/* Entregador */}

                              {item.courier_name && (
                                <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                                  Entregador:{' '}
                                  {
                                    item.courier_name
                                  }
                                </span>
                              )}

                              {/* Taxa */}

                              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md flex items-center gap-0.5 border border-emerald-100">

                                <DollarSign className="h-3 w-3" />

                                {Number(
                                  item.delivery_fee ??
                                    0
                                ).toFixed(2)}

                              </span>

                              {/* Status */}

                              {getStatusBadge(
                                item.status
                              )}

                              {/* Observações */}

                              {item.completion_notes && (
                                <span className="text-[11px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded italic">
                                  Obs/Recebedor:{' '}
                                  {
                                    item.completion_notes
                                  }
                                </span>
                              )}

                            </div>

                            {/* Endereço */}

                            <p className="text-xs text-slate-500">
                              {item.address ||
                                'Sem endereço informado'}
                            </p>

                            {/* Telefone */}

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
                                    href={`https://wa.me/55${item.phone.replace(
                                      /\D/g,
                                      ''
                                    )}`}
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

                          {/* Controles */}

                          <div className="flex items-center gap-3">

                            {/* Status rápido */}

                            <select
                              value={
                                item.status
                              }
                              onChange={(event) =>
                                handleQuickStatusChange(
                                  item.id,
                                  event.target.value as DeliveryStatus
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

                            {/* Editar */}

                            <button
                              type="button"
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