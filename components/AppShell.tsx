'use client';

import { ReactNode, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogOut, Menu, X, Clock } from 'lucide-react';
import { NAV_LINKS, ROLE_LABEL, type Role, type Session } from '@/lib/types';
import { getSession, logout } from '@/lib/auth';

interface AppShellProps {
  activePath: string;
  children: ReactNode;
}

const ICONS = {
  grid: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <rect x="4" y="4" width="7" height="7" rx="1" />
      <rect x="13" y="4" width="7" height="7" rx="1" />
      <rect x="4" y="13" width="7" height="7" rx="1" />
      <rect x="13" y="13" width="7" height="7" rx="1" />
    </svg>
  ),
  layout: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <rect x="3" y="4" width="18" height="16" rx="1" />
      <path d="M3 9h18M9 9v11" />
    </svg>
  ),
  ticket: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M3 8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4z" />
    </svg>
  ),
  book: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V4H6.5A2.5 2.5 0 0 0 4 6.5z" />
      <path d="M4 6.5V19.5" />
    </svg>
  ),
  box: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M21 8 12 3 3 8v8l9 5 9-5z" />
      <path d="M3 8l9 5 9-5M12 13v8" />
    </svg>
  ),
  chart: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M4 20V10M12 20V4M20 20v-7" />
    </svg>
  )
};

export default function AppShell({ activePath, children }: AppShellProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [time, setTime] = useState('');

  useEffect(() => {
    const init = async () => {
      const s = await getSession();
      setSession(s);
    };
    init();
  }, []);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(
        now.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }) +
        '  •  ' +
        now.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const pathname = usePathname() ?? '/dashboard';

  if (!session) return null;

  const filteredLinks = NAV_LINKS.filter(l => l.roles.includes(session.role));

  return (
    <div className="flex min-h-screen bg-paper">
      <aside className="w-64 flex-shrink-0 bg-ink text-paper/90 flex flex-col p-5 sticky top-0 h-screen hidden lg:flex border-r border-line-soft">
        <div className="flex items-center gap-3 px-2 pb-5 mb-5 border-b border-white/10">
          <div className="w-10 h-10 rounded-xl bg-ink flex items-center justify-center shrink-0 overflow-hidden border border-line-soft">
            <img src="/assets/logo/copper-fork-mark.svg" alt="The Copper Fork" className="w-full h-full object-cover" />
          </div>
          <div className="flex flex-col leading-tight">
            <strong className="font-display text-base text-white">The Copper Fork</strong>
            <small className="text-stone-400 text-xs tracking-wider uppercase">Restaurant OS</small>
          </div>
        </div>

        <nav className="flex-1 flex flex-col gap-1" aria-label="Main navigation">
          {filteredLinks.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-stone-300 text-sm font-medium transition-colors ${
                pathname === link.href
                  ? 'bg-accent text-white'
                  : 'hover:bg-white/5 hover:text-white'
              }`}
            >
              {ICONS[link.icon as keyof typeof ICONS]}
              <span>{link.label}</span>
            </Link>
          ))}
        </nav>

        <div className="border-t border-white/10 pt-3.5 mt-2">
          <div className="flex items-center gap-3 px-2 py-1.5 mb-3">
            <div className="w-8 h-8 rounded-full bg-accent-tint text-accent-ink flex items-center justify-center font-bold text-xs shrink-0">
              {session.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <strong className="block text-white text-sm truncate">{session.name}</strong>
              <small className="text-stone-400 text-xs">{ROLE_LABEL[session.role]}</small>
            </div>
          </div>
          <button
            onClick={async () => {
              await logout();
            }}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-transparent border border-white/20 text-stone-300 text-sm font-medium hover:bg-white/5 hover:text-white transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Log out</span>
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="flex items-center justify-between px-6 py-4 bg-surface border-b border-line sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-stone-100 text-ink"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <h1 className="font-display text-2xl font-semibold text-ink">{getPageTitle(pathname)}</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-stone-50 rounded-lg font-mono text-xs text-muted">
              <Clock className="w-3.5 h-3.5" />
              <span>{time}</span>
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 lg:p-7 overflow-auto">{children}</main>
      </div>

      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-ink/50" onClick={() => setMobileMenuOpen(false)} />
      )}
      {mobileMenuOpen && (
        <aside className="lg:hidden fixed inset-y-0 left-0 z-50 w-64 bg-ink text-paper/90 p-5 flex flex-col transform transition-transform">
          <div className="flex items-center gap-3 px-2 pb-5 mb-5 border-b border-white/10">
            <div className="w-10 h-10 rounded-xl bg-ink flex items-center justify-center shrink-0 overflow-hidden border border-line-soft">
              <img src="/assets/logo/copper-fork-mark.svg" alt="The Copper Fork" className="w-full h-full object-cover" />
            </div>
            <div className="flex flex-col leading-tight">
              <strong className="font-display text-base text-white">The Copper Fork</strong>
              <small className="text-stone-400 text-xs tracking-wider uppercase">Restaurant OS</small>
            </div>
          </div>
          <nav className="flex-1 flex flex-col gap-1">
            {filteredLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-stone-300 text-sm font-medium transition-colors ${
                  pathname === link.href
                    ? 'bg-accent text-white'
                    : 'hover:bg-white/5 hover:text-white'
                }`}
              >
                {ICONS[link.icon as keyof typeof ICONS]}
                <span>{link.label}</span>
              </Link>
            ))}
          </nav>
          <div className="border-t border-white/10 pt-3.5 mt-2">
            <div className="flex items-center gap-3 px-2 py-1.5 mb-3">
              <div className="w-8 h-8 rounded-full bg-accent-tint text-accent-ink flex items-center justify-center font-bold text-xs shrink-0">
                {session.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <strong className="block text-white text-sm truncate">{session.name}</strong>
                <small className="text-stone-400 text-xs">{ROLE_LABEL[session.role]}</small>
              </div>
            </div>
            <button
              onClick={async () => {
                await logout();
              }}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-transparent border border-white/20 text-stone-300 text-sm font-medium hover:bg-white/5 hover:text-white transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Log out</span>
            </button>
          </div>
        </aside>
      )}
    </div>
  );
}

function getPageTitle(pathname: string): string {
  const titles: Record<string, string> = {
    '/dashboard': 'Dashboard',
    '/tables': 'Tables',
    '/orders': 'Orders & Kitchen',
    '/menu': 'Menu Management',
    '/inventory': 'Inventory',
    '/reports': 'Sales Reports'
  };
  return titles[pathname] || 'The Copper Fork';
}