'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Menu, X, PackagePlus, ClipboardList, Users, ContactRound, Wallet, Truck, LogOut, Download } from 'lucide-react';

type Props = { role: 'OPERATOR' | 'SUPERVISOR' | 'COURIER' };

export default function GlobalMenu({ role }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const logout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      const res = await fetch('/api/auth/logout', { method: 'POST' });
      if (!res.ok) throw new Error('Logout falhou');
      router.replace('/login');
      router.refresh();
    } catch {
      alert('Não foi possível sair. Tente novamente.');
      setLoggingOut(false);
    }
  };
  const [open, setOpen] = useState(false);
  const apkUrl = 'https://github.com/avnds/express-delivery/releases/latest/download/rotix-express-delivery.apk';
  const supervisor = role === 'SUPERVISOR';
  const pageInfo = pathname === '/courier/earnings'
    ? { title: 'Extrato de Ganhos', description: 'Seus ganhos como entregador' }
    : pathname === '/courier'
      ? { title: 'Fila de Entregas', description: 'Visão do Entregador' }
      : pathname === '/supervisor'
        ? { title: 'Painel do Supervisor', description: 'Gerenciamento global e edição das ordens de entrega' }
        : { title: 'Painel do Operador', description: 'Gestão e cadastro de ordens de entrega' };
  const items = [
    ...(role !== 'COURIER' ? [{ label: 'Operador', href: '/operator', icon: PackagePlus }] : [
      { label: 'Entregas', href: '/courier', icon: Truck },
      { label: 'Meus ganhos', href: '/courier/earnings', icon: Wallet },
    ]),
    ...(supervisor ? [
      { label: 'Supervisor', href: '/supervisor', icon: ClipboardList },
      { label: 'Usuários', href: '/supervisor#usuarios', icon: Users },
      { label: 'Clientes', href: '/supervisor#clientes', icon: ContactRound },
      { label: 'Ganhos', href: '/supervisor#ganhos', icon: Wallet },
    ] : []),
  ];

  return (
    <nav aria-label="Menu global" className="sticky top-0 z-50 border-b border-slate-200 bg-white shadow-sm">
      <div className="mx-auto max-w-7xl px-4 py-2">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="shrink-0 rounded-xl bg-white p-1 shadow-sm">
              <img src="/ico android.png" alt="Rotix" className="h-10 w-10 object-contain" />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-sm font-black text-[#002B5C] sm:text-lg">{pageInfo.title}</h1>
              <p className="hidden truncate text-xs text-slate-500 sm:block">{pageInfo.description}</p>
            </div>
          </div>
          <button type="button" className="rounded-lg border border-slate-200 p-2 text-[#002B5C] md:hidden"
            aria-label={open ? 'Fechar menu' : 'Abrir menu'} aria-expanded={open}
            onClick={() => setOpen(!open)}>
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div className="hidden flex-wrap gap-2 md:flex">
            {items.map(({ label, href, icon: Icon }) => (
              <Link key={href} href={href}
                aria-current={pathname === href.split('#')[0] && !href.includes('#') ? 'page' : undefined}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-[#002B5C] hover:bg-slate-100">
                <Icon size={16} />{label}
              </Link>
            ))}
            <a href={apkUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-[#002B5C] hover:bg-slate-100"><Download size={16} />Baixar APK</a>
          <button type="button" onClick={logout} disabled={loggingOut} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"><LogOut size={16} />{loggingOut ? 'Saindo...' : 'Sair'}</button>
          </div>
        </div>
        {open && <div className="flex flex-col gap-1 border-t border-slate-100 pt-2 md:hidden">
          {items.map(({ label, href, icon: Icon }) => (
            <Link key={href} href={href} onClick={() => setOpen(false)}
              className="flex items-center gap-2 rounded-lg px-3 py-3 text-sm font-semibold text-[#002B5C] hover:bg-slate-100">
              <Icon size={18} />{label}
            </Link>
          ))}
          <a href={apkUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-lg px-3 py-3 text-sm font-semibold text-[#002B5C] hover:bg-slate-100"><Download size={18} />Baixar APK</a>
          <button type="button" onClick={logout} disabled={loggingOut} className="flex items-center gap-2 rounded-lg px-3 py-3 text-left text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"><LogOut size={18} />{loggingOut ? 'Saindo...' : 'Sair'}</button>
        </div>}
      </div>
    </nav>
  );
}
