'use client';

import { useState } from 'react';
import { UserPlus, Loader2, CheckCircle2, XCircle } from 'lucide-react';

type UserRole = 'OPERATOR' | 'SUPERVISOR' | 'COURIER';

export default function UserManagement() {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<UserRole>('OPERATOR');

  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');

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
    } catch {
      setMessage('Erro de conexão ao cadastrar usuário.');
      setMessageType('error');
    } finally {
      setIsSaving(false);
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

      <form onSubmit={handleSubmit} className="p-4 space-y-4">
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

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 8 caracteres"
              required
              minLength={8}
              className="mt-1 w-full text-xs p-2.5 border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FF6600]/30 focus:border-[#FF6600]"
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase">
              Confirmar senha
            </label>

            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Digite a senha novamente"
              required
              minLength={8}
              className="mt-1 w-full text-xs p-2.5 border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FF6600]/30 focus:border-[#FF6600]"
            />
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
            className={`flex items-center gap-2 p-3 rounded-xl text-xs font-semibold ${
              messageType === 'success'
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
    </div>
  );
}