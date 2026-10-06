'use client';

import { Store } from './storage';
import type { Session, Role } from './types';
export { toast } from '@/components/Toast';

export async function getSession(): Promise<Session | null> {
  if (typeof window === 'undefined') return null;
  return Store.session();
}

export async function requireAuth(allowedRoles?: Role[]): Promise<Session | null> {
  if (typeof window === 'undefined') return null;

  const session = await Store.session();
  if (!session) {
    window.location.href = '/login';
    return null;
  }
  if (allowedRoles && !allowedRoles.includes(session.role)) {
    alert(`Your role (${session.role}) doesn't have access to this page.`);
    const home = ROLE_HOME[session.role];
    window.location.href = home;
    return null;
  }
  return session;
}

export async function clearSession(): Promise<void> {
  await Store.clearSession();
}

export async function login(user: { id: string; username: string; name: string; role: Role }): Promise<void> {
  const session: Session = {
    id: user.id,
    username: user.username,
    name: user.name,
    role: user.role,
    loginAt: new Date().toISOString()
  };
  await Store.saveSession(session);
}

export async function logout(): Promise<void> {
  await Store.clearSession();
  window.location.href = '/login';
}

const ROLE_HOME: Record<Role, string> = {
  admin: '/dashboard',
  manager: '/dashboard',
  waiter: '/tables',
  kitchen: '/orders'
};
