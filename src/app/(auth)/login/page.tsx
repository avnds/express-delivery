'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Package, Lock, Mail, Loader2, ArrowRight, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  /*const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');

    try {
      // Simulação de autenticação inicial para validação de interface
      if (!email || !password) {
        setErrorMessage('Preencha todos os campos.');
        setIsLoading(false);
        return;
      }

      router.push('/operator');
    } catch {
      setErrorMessage('Ocorreu um erro ao tentar fazer login. Tente novamente.');
      setIsLoading(false);
    }
  };*/

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsLoading(true);
  setErrorMessage('');

  try {
    if (!email || !password) {
      setErrorMessage('Preencha todos os campos.');
      return;
    }

    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: email,
        password,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      setErrorMessage(data.error || 'Usuário ou senha inválidos.');
      return;
    }

    if (data.user.mustChangePassword) {
      router.push('/change-password');
      return;
    }

    switch (data.user.role) {
      case 'OPERATOR':
        router.push('/operator');
        break;

      case 'SUPERVISOR':
        router.push('/supervisor');
        break;

      case 'COURIER':
        router.push('/courier');
        break;

      default:
        setErrorMessage('Perfil de usuário inválido.');
    }
  } catch (error) {
    console.error('Erro ao fazer login:', error);
    setErrorMessage('Não foi possível conectar ao servidor.');
  } finally {
    setIsLoading(false);
  }
};

  return (
    <div className="min-h-screen w-full bg-[#002B5C] flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#FF6600]/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-[#002B5C]/30 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-100">
        <div className="bg-[#002B5C] p-8 text-center border-b-4 border-[#FF6600]">
          <div className="inline-flex items-center justify-center w-70 h-15 rounded-2xl bg-[#FF6600] text-white shadow-lg shadow-black/20 mb-4">
            <img
              src="/banner 1.png"
              alt="Rotix"
              className="h-14 w-60 object-contain"
            />
          </div>

        <h1 className="text-2xl font-black text-white tracking-tight">
          Login
        </h1>

      <p className="text-xs text-white/70 mt-1">
        Plataforma Unificada de Gestão e Entregas
      </p>
    </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          {errorMessage && (
            <div className="flex items-center gap-2 p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-medium">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Usuário
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Digite seu usuário"
                className="w-full pl-10 pr-4 py-3 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#FF6600] focus:border-[#FF6600] transition outline-none text-slate-900 placeholder:text-slate-400"
              />
              <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Senha
              </label>
              <a href="#" className="text-xs text-[#002B5C] font-semibold hover:underline">
                Esqueceu a senha?
              </a>
            </div>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-3 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#FF6600] focus:border-[#FF6600] transition outline-none text-slate-900 placeholder:text-slate-400"
              />
              <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 bg-[#002B5C] hover:bg-[#00234D] active:bg-[#001B3D] text-white font-bold rounded-xl text-sm transition shadow-lg shadow-[#002B5C]/25 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Autenticando...</span>
              </>
            ) : (
              <>
                <span>Entrar no Sistema</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        <div className="px-8 py-4 bg-slate-50 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-500">
            Acesso restrito para **Operadores**, **Entregadores** e **Supervisores**.
          </p>
        </div>
      </div>
    </div>
  );
}