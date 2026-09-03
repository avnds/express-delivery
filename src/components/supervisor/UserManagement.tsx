'use client';

import { useEffect, useState } from 'react';
import {
  UserPlus,
  Loader2,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
  Trash2,
  Edit3,
  Check,
  X,
} from 'lucide-react';

type UserRole = 'OPERATOR' | 'SUPERVISOR' | 'COURIER';

interface User {
  id: string;
  name: string;
  username: string;
  role: UserRole;
}

export default function UserManagement() {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [role, setRole] = useState<UserRole>('OPERATOR');

  const [users, setUsers] = useState<User[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [deletingUserId, setDeletingUserId] = useState('');
  const [editingUserId, setEditingUserId] = useState('');
  const [editName, setEditName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('OPERATOR');
  const [editPassword, setEditPassword] = useState('');
  const [savingEditUserId, setSavingEditUserId] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');

  const loadUsers = async () => {
    try {
      setIsLoadingUsers(true);

      const res = await fetch('/api/users', {
        cache: 'no-store',
      });

      const data = await res.json();

      if (res.ok) {
        setUsers(data.users || data);
      }
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setMessage('');
    setMessageType('');

    if (password.length < 8) {
      setMessage('A senha deve possuir pelo menos 8 caracteres.');
      setMessageType('error');
      return;
    }

    if (password !== confirmPassword) {
      setMessage('As senhas não coincidem.');
      setMessageType('error');
      return;
    }

    try {
      setIsSaving(true);

      const res = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          username,
          password,
          role,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.error || 'Erro ao cadastrar usuário.');
        setMessageType('error');
        return;
      }

      setMessage('Usuário cadastrado com sucesso.');
      setMessageType('success');

      setName('');
      setUsername('');
      setPassword('');
      setConfirmPassword('');
      setRole('OPERATOR');

      await loadUsers();
    } catch {
      setMessage('Erro de conexão ao cadastrar usuário.');
      setMessageType('error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteUser = async (user: User) => {
    if (user.role === 'SUPERVISOR') {
      return;
    }

    const confirmed = window.confirm(
      `Deseja realmente excluir o usuário "${user.name}"?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingUserId(user.id);
      setMessage('');
      setMessageType('');

      const res = await fetch('/api/users', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: user.id,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.error || 'Erro ao excluir usuário.');
        setMessageType('error');
        return;
      }

      setMessage('Usuário excluído com sucesso.');
      setMessageType('success');

      await loadUsers();
    } catch {
      setMessage('Erro de conexão ao excluir usuário.');
      setMessageType('error');
    } finally {
      setDeletingUserId('');
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUserId(user.id);
    setEditName(user.name);
    setEditUsername(user.username);
    setEditRole(user.role);
    setEditPassword('');
    setMessage('');
    setMessageType('');
  };

  const handleCancelEdit = () => {
    setEditingUserId('');
    setEditName('');
    setEditUsername('');
    setEditRole('OPERATOR');
    setEditPassword('');
  };

  const handleSaveEdit = async (user: User) => {
    if (!editName.trim() || !editUsername.trim()) {
      setMessage('Nome e usuário são obrigatórios.');
      setMessageType('error');
      return;
    }

    if (editPassword && editPassword.length < 8) {
      setMessage('A senha deve possuir pelo menos 8 caracteres.');
      setMessageType('error');
      return;
    }

    try {
      setSavingEditUserId(user.id);
      setMessage('');
      setMessageType('');

      const res = await fetch('/api/users', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: user.id,
          name: editName,
          username: editUsername,
          role: editRole,
          password: editPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.error || 'Erro ao alterar usuário.');
        setMessageType('error');
        return;
      }

      setMessage('Usuário alterado com sucesso.');
      setMessageType('success');

      handleCancelEdit();
      await loadUsers();
    } catch {
      setMessage('Erro de conexão ao alterar usuário.');
      setMessageType('error');
    } finally {
      setSavingEditUserId('');
    }
  };

  const getRoleLabel = (userRole: UserRole) => {
    switch (userRole) {
      case 'SUPERVISOR':
        return 'Supervisor';
      case 'COURIER':
        return 'Entregador';
      default:
        return 'Operador';
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-slate-100 flex items-center gap-2">
        <div className="p-2 bg-[#002B5C] rounded-xl text-white">
          <UserPlus className="h-4 w-4" />
        </div>

        <div>
          <h2 className="font-bold text-xs text-slate-800 uppercase tracking-wider">
            Cadastro de Usuário
          </h2>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Crie acessos para Operadores, Supervisores e Entregadores
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        autoComplete="off"
        className="p-4 space-y-4"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase">
              Nome
            </label>

            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nome completo"
              required
              className="mt-1 w-full text-xs p-2.5 border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FF6600]/30 focus:border-[#FF6600]"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase">
              Usuário
            </label>

            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Nome de acesso"
              autoComplete="new-username"
              required
              className="mt-1 w-full text-xs p-2.5 border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FF6600]/30 focus:border-[#FF6600]"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase">
              Perfil
            </label>

            <select
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="mt-1 w-full text-xs p-2.5 border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FF6600]/30 focus:border-[#FF6600]"
            >
              <option value="OPERATOR">Operador</option>
              <option value="SUPERVISOR">Supervisor</option>
              <option value="COURIER">Entregador</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase">
              Senha
            </label>

            <div className="relative mt-1">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 8 caracteres"
                autoComplete="new-password"
                required
                minLength={8}
                className="w-full text-xs p-2.5 pr-10 border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FF6600]/30 focus:border-[#FF6600]"
              />

              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-[#002B5C]"
                aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase">
              Confirmar senha
            </label>

            <div className="relative mt-1">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Digite a senha novamente"
                autoComplete="new-password"
                required
                minLength={8}
                className="w-full text-xs p-2.5 pr-10 border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FF6600]/30 focus:border-[#FF6600]"
              />

              <button
                type="button"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-[#002B5C]"
                aria-label={
                  showConfirmPassword
                    ? 'Ocultar senha'
                    : 'Mostrar senha'
                }
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={isSaving}
              className="w-full sm:w-auto px-5 py-2.5 bg-[#FF6600] hover:bg-[#E65C00] text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition shadow-sm disabled:opacity-50"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <UserPlus className="h-4 w-4" />
              )}

              {isSaving ? 'Cadastrando...' : 'Cadastrar Usuário'}
            </button>
          </div>
        </div>

        {message && (
          <div
            className={`flex items-center gap-2 p-3 rounded-xl text-xs font-semibold ${messageType === 'success'
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
              : 'bg-red-50 text-red-700 border border-red-100'
              }`}
          >
            {messageType === 'success' ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <XCircle className="h-4 w-4" />
            )}

            {message}
          </div>
        )}
      </form>

      <div className="border-t border-slate-100">
        <div className="p-4">
          <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider">
            Usuários cadastrados
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Supervisores não podem ser excluídos.
          </p>
        </div>

        {isLoadingUsers ? (
          <div className="px-4 pb-5 flex items-center gap-2 text-xs text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Carregando usuários...
          </div>
        ) : users.length === 0 ? (
          <div className="px-4 pb-5 text-xs text-slate-500">
            Nenhum usuário cadastrado.
          </div>
        ) : (
          <div className="px-4 pb-5 space-y-2">
            {users.map((user) => (
              <div
                key={user.id}
                className="border border-slate-200 rounded-xl p-3"
              >
                {editingUserId === user.id ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase">
                          Nome
                        </label>

                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="mt-1 w-full text-xs p-2.5 border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#002B5C]/20 focus:border-[#002B5C]"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase">
                          Usuário
                        </label>

                        <input
                          type="text"
                          value={editUsername}
                          onChange={(e) => setEditUsername(e.target.value)}
                          autoComplete="off"
                          className="mt-1 w-full text-xs p-2.5 border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#002B5C]/20 focus:border-[#002B5C]"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase">
                          Perfil
                        </label>

                        <select
                          value={editRole}
                          onChange={(e) =>
                            setEditRole(e.target.value as UserRole)
                          }
                          className="mt-1 w-full text-xs p-2.5 border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#002B5C]/20 focus:border-[#002B5C]"
                        >
                          <option value="OPERATOR">Operador</option>
                          <option value="SUPERVISOR">Supervisor</option>
                          <option value="COURIER">Entregador</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase">
                          Nova senha
                        </label>

                        <input
                          type="password"
                          value={editPassword}
                          onChange={(e) => setEditPassword(e.target.value)}
                          placeholder="Deixe vazio para manter"
                          autoComplete="new-password"
                          className="mt-1 w-full text-xs p-2.5 border border-slate-300 rounded-lg bg-white text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#002B5C]/20 focus:border-[#002B5C]"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        disabled={savingEditUserId === user.id}
                        className="px-3 py-2 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 text-xs font-bold flex items-center justify-center gap-2 transition disabled:opacity-50"
                      >
                        <X className="h-4 w-4" />
                        Cancelar
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSaveEdit(user)}
                        disabled={savingEditUserId === user.id}
                        className="px-3 py-2 rounded-lg bg-[#002B5C] text-white hover:bg-[#001F42] text-xs font-bold flex items-center justify-center gap-2 transition disabled:opacity-50"
                      >
                        {savingEditUserId === user.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Check className="h-4 w-4" />
                        )}

                        {savingEditUserId === user.id
                          ? 'Salvando...'
                          : 'Salvar'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-800">
                        {user.name}
                      </p>

                      <p className="text-xs text-slate-500">
                        @{user.username}
                      </p>

                      <span className="inline-flex mt-1 px-2 py-1 rounded-md bg-slate-100 text-[10px] font-bold text-slate-600 uppercase">
                        {getRoleLabel(user.role)}
                      </span>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2">
                      <button
                        type="button"
                        onClick={() => handleEditUser(user)}
                        className="w-full sm:w-auto px-3 py-2 rounded-lg border border-[#002B5C]/20 text-[#002B5C] hover:bg-slate-50 text-xs font-bold flex items-center justify-center gap-2 transition"
                      >
                        <Edit3 className="h-4 w-4" />
                        Alterar
                      </button>
                      {/*{user.role !== 'SUPERVISOR' && (*/}
                      {/*
{user.role === 'COURIER' && (
  <button
    type="button"
    onClick={() => handleDeleteUser(user)}
    disabled={deletingUserId === user.id}
    className="w-full sm:w-auto px-3 py-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold flex items-center justify-center gap-2 transition disabled:opacity-50"
  >
    {deletingUserId === user.id ? (
      <Loader2 className="h-4 w-4 animate-spin" />
    ) : (
      <Trash2 className="h-4 w-4" />
    )}

    {deletingUserId === user.id
      ? 'Excluindo...'
      : 'Excluir'}
  </button>
)}
*/}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}