'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Store } from '@/lib/storage';
import { login, getSession } from '@/lib/auth';
import type { User } from '@/lib/types';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const init = async () => {
      const session = await getSession();
      if (session) {
        redirectForRole(session.role);
      }
    };
    init();
  }, []);

  const redirectForRole = (role: User['role']) => {
    const map: Record<User['role'], string> = {
      admin: '/dashboard',
      manager: '/dashboard',
      waiter: '/tables',
      kitchen: '/orders'
    };
    router.push(map[role] || '/dashboard');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const users = await Store.users();
    const user = users.find(
      (u: User) => u.username === username && u.password === password
    );
    if (!user) {
      setError('Incorrect username or password.');
      return;
    }
    login({ id: user.id, username: user.username, name: user.name, role: user.role });
    redirectForRole(user.role);
  };

  return (
    <div className="min-h-screen bg-ink relative overflow-x-hidden">
      <div className="fixed inset-0 z-0 bg-[radial-gradient(circle_at_50%_0%,rgba(193,80,46,0.20),transparent_60%),url('/assets/logo/copper-fork-mark.svg')] bg-no-repeat bg-cover opacity-100" />
      <div className="fixed inset-0 z-0 bg-ink/93" />

      <div className="relative z-1 min-h-screen flex items-center justify-center p-5">
        <div className="w-full max-w-[420px] bg-paper rounded-2xl shadow-[0_20px_50px_rgba(34,32,29,0.18)] p-10">
          <div className="flex flex-col items-center text-center mb-7">
            <img
              src="/assets/logo/copper-fork-mark.svg"
              alt="The Copper Fork"
              className="w-20 h-20 rounded-2xl shadow-[0_6px_20px_rgba(34,32,29,0.08)] mb-4"
            />
            <h1 className="font-display text-2xl font-semibold text-ink mb-1">The Copper Fork</h1>
            <p className="text-muted text-sm">Restaurant Management System</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5" autoComplete="off">
            {error && (
              <p className="text-danger text-sm min-h-[16px] mb-1" role="alert">{error}</p>
            )}

            <label className="block text-xs font-semibold text-ink-soft mb-1">
              Username
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. manager"
                required
                className="w-full mt-2 px-3 py-3 border border-line rounded-lg text-base bg-surface text-ink focus:border-accent focus:outline-none transition-colors"
              />
            </label>

            <label className="block text-xs font-semibold text-ink-soft mb-1">
              Password
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full mt-2 px-3 py-3 border border-line rounded-lg text-base bg-surface text-ink focus:border-accent focus:outline-none transition-colors"
              />
            </label>

            <button
              type="submit"
              className="w-full bg-accent text-white py-3 px-4 rounded-lg font-semibold text-base hover:bg-accent-ink transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
            >
              Sign in
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}