"use client";

import { useCallback, useEffect, useState } from "react";
import {
    Check,
    Edit3,
    Loader2,
    Search,
    Trash2,
    X,
} from "lucide-react";

interface Client {
    id: string;
    phone: string;
    name: string;
    address: string;
    created_at?: string;
    updated_at?: string;
}

export default function ClientManagement() {
    const [clients, setClients] = useState<Client[]>([]);

    const [searchName, setSearchName] = useState("");
    const [searchPhone, setSearchPhone] = useState("");

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [editingId, setEditingId] = useState<string | null>(null);

    const [editName, setEditName] = useState("");
    const [editPhone, setEditPhone] = useState("");
    const [editAddress, setEditAddress] = useState("");

    const [saving, setSaving] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const loadClients = useCallback(async () => {
        try {
            setLoading(true);
            setError("");

            const params = new URLSearchParams();

            if (searchName.trim()) {
                params.set("name", searchName.trim());
            }

            if (searchPhone.trim()) {
                params.set(
                    "phone",
                    searchPhone.replace(/\D/g, "")
                );
            }

            const query = params.toString();

            const response = await fetch(
                `/api/clients${query ? `?${query}` : ""}`,
                {
                    cache: "no-store",
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.error || "Erro ao carregar clientes."
                );
            }

            setClients(data.clients || []);
        } catch (err) {
            console.error("Erro ao carregar clientes:", err);

            setError(
                err instanceof Error
                    ? err.message
                    : "Erro ao carregar clientes."
            );
        } finally {
            setLoading(false);
        }
    }, [searchName, searchPhone]);

    useEffect(() => {
        loadClients();
    }, [loadClients]);

    const handleSearch = async () => {
        await loadClients();
    };

    const handleEdit = (client: Client) => {
        setEditingId(client.id);
        setEditName(client.name);
        setEditPhone(client.phone);
        setEditAddress(client.address);
        setError("");
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setEditName("");
        setEditPhone("");
        setEditAddress("");
    };

    const handleSaveEdit = async () => {
        if (!editingId) {
            return;
        }

        if (
            !editName.trim() ||
            !editPhone.trim() ||
            !editAddress.trim()
        ) {
            setError(
                "Nome, telefone e endereço são obrigatórios."
            );
            return;
        }

        try {
            setSaving(true);
            setError("");

            const response = await fetch(
                `/api/clients/${editingId}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        name: editName,
                        phone: editPhone,
                        address: editAddress,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.error || "Erro ao alterar cliente."
                );
            }

            handleCancelEdit();
            await loadClients();
        } catch (err) {
            console.error("Erro ao alterar cliente:", err);

            setError(
                err instanceof Error
                    ? err.message
                    : "Erro ao alterar cliente."
            );
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (client: Client) => {
        const confirmed = window.confirm(
            `Deseja realmente excluir o cliente "${client.name}"?`
        );

        if (!confirmed) {
            return;
        }

        try {
            setDeletingId(client.id);
            setError("");

            const response = await fetch(
                `/api/clients/${client.id}`,
                {
                    method: "DELETE",
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.error || "Erro ao excluir cliente."
                );
            }

            if (editingId === client.id) {
                handleCancelEdit();
            }

            await loadClients();
        } catch (err) {
            console.error("Erro ao excluir cliente:", err);

            setError(
                err instanceof Error
                    ? err.message
                    : "Erro ao excluir cliente."
            );
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <section className="mb-8 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-4">
                <h2 className="text-xl font-bold text-[#002B5C]">
                    Clientes
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                    Consulte, altere ou exclua os clientes cadastrados.
                </p>
            </div>

            {/* Filtros */}
            <div className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-[1fr_1fr_auto]">
                <input
                    type="text"
                    value={searchName}
                    onChange={(e) =>
                        setSearchName(e.target.value)
                    }
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            handleSearch();
                        }
                    }}
                    placeholder="Buscar por nome"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-500 outline-none transition focus:border-[#002B5C] focus:ring-1 focus:ring-[#002B5C]"
                />

                <input
                    type="text"
                    value={searchPhone}
                    onChange={(e) =>
                        setSearchPhone(e.target.value)
                    }
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            handleSearch();
                        }
                    }}
                    placeholder="Buscar por telefone"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-500 outline-none transition focus:border-[#002B5C] focus:ring-1 focus:ring-[#002B5C]"
                />

                <button
                    type="button"
                    onClick={handleSearch}
                    disabled={loading}
                    className="flex items-center justify-center gap-2 rounded-lg bg-[#002B5C] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {loading ? (
                        <Loader2
                            size={17}
                            className="animate-spin"
                        />
                    ) : (
                        <Search size={17} />
                    )}

                    Buscar
                </button>
            </div>

            {error && (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {error}
                </div>
            )}

            {/* Lista */}
            {loading ? (
                <div className="flex items-center justify-center py-10 text-slate-500">
                    <Loader2
                        size={24}
                        className="mr-2 animate-spin"
                    />
                    Carregando clientes...
                </div>
            ) : clients.length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-300 px-4 py-10 text-center text-sm text-slate-500">
                    Nenhum cliente encontrado.
                </div>
            ) : (
                <div className="space-y-3">
                    {clients.map((client) => {
                        const isEditing =
                            editingId === client.id;

                        return (
                            <div
                                key={client.id}
                                className="rounded-lg border border-slate-200 p-4"
                            >
                                {isEditing ? (
                                    <div className="space-y-3">
                                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                            <input
                                                type="text"
                                                value={editName}
                                                onChange={(e) =>
                                                    setEditName(
                                                        e.target.value
                                                    )
                                                }
                                                placeholder="Nome"
                                                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-500 outline-none focus:border-[#002B5C] focus:ring-1 focus:ring-[#002B5C]"
                                            />

                                            <input
                                                type="text"
                                                value={editPhone}
                                                onChange={(e) =>
                                                    setEditPhone(
                                                        e.target.value
                                                    )
                                                }
                                                placeholder="Telefone"
                                                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-500 outline-none focus:border-[#002B5C] focus:ring-1 focus:ring-[#002B5C]"
                                            />
                                        </div>

                                        <textarea
                                            value={editAddress}
                                            onChange={(e) =>
                                                setEditAddress(
                                                    e.target.value
                                                )
                                            }
                                            placeholder="Endereço"
                                            rows={2}
                                            className="w-full resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-500 outline-none focus:border-[#002B5C] focus:ring-1 focus:ring-[#002B5C]"
                                        />

                                        <div className="flex flex-wrap justify-end gap-2">
                                            <button
                                                type="button"
                                                onClick={
                                                    handleCancelEdit
                                                }
                                                disabled={saving}
                                                className="flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                                            >
                                                <X size={16} />
                                                Cancelar
                                            </button>

                                            <button
                                                type="button"
                                                onClick={
                                                    handleSaveEdit
                                                }
                                                disabled={saving}
                                                className="flex items-center gap-2 rounded-lg bg-[#002B5C] px-3 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
                                            >
                                                {saving ? (
                                                    <Loader2
                                                        size={16}
                                                        className="animate-spin"
                                                    />
                                                ) : (
                                                    <Check
                                                        size={16}
                                                    />
                                                )}

                                                Salvar
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                                        <div className="min-w-0 space-y-1">
                                            <p className="font-semibold text-slate-900">
                                                {client.name}
                                            </p>

                                            <p className="text-sm text-slate-600">
                                                <span className="font-medium">
                                                    Telefone:
                                                </span>{" "}
                                                {client.phone}
                                            </p>

                                            <p className="text-sm text-slate-600 break-words">
                                                <span className="font-medium">
                                                    Endereço:
                                                </span>{" "}
                                                {client.address}
                                            </p>
                                        </div>

                                        <div className="flex shrink-0 flex-wrap gap-2">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    handleEdit(
                                                        client
                                                    )
                                                }
                                                className="flex items-center gap-2 rounded-lg border border-[#002B5C] px-3 py-2 text-sm font-semibold text-[#002B5C] transition hover:bg-slate-50"
                                            >
                                                <Edit3 size={16} />
                                                Alterar
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    handleDelete(
                                                        client
                                                    )
                                                }
                                                disabled={
                                                    deletingId ===
                                                    client.id
                                                }
                                                className="flex items-center gap-2 rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                                            >
                                                {deletingId ===
                                                client.id ? (
                                                    <Loader2
                                                        size={16}
                                                        className="animate-spin"
                                                    />
                                                ) : (
                                                    <Trash2
                                                        size={16}
                                                    />
                                                )}

                                                Excluir
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </section>
    );
}