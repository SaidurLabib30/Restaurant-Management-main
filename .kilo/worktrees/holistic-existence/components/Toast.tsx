'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle, AlertCircle, Info } from 'lucide-react';

type ToastKind = 'info' | 'success' | 'error';

interface ToastProps {
  message: string;
  kind?: ToastKind;
  onClose?: () => void;
}

function ToastItem({ message, kind = 'info', onClose }: ToastProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onClose?.(), 250);
    }, 2800);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgClass = {
    info: 'bg-ink',
    success: 'bg-herb',
    error: 'bg-danger'
  }[kind];

  const iconMap = {
    info: <Info className="w-4 h-4" />,
    success: <CheckCircle className="w-4 h-4" />,
    error: <AlertCircle className="w-4 h-4" />
  }[kind];

  if (!visible) return null;

  return (
    <div className={`${bgClass} text-white px-4 py-3 rounded-lg shadow-[0_20px_50px_rgba(34,32,29,0.18)] flex items-center gap-3 min-w-[280px] animate-slide-up`}>
      {iconMap}
      <span className="text-sm">{message}</span>
    </div>
  );
}

interface ToastContainerProps {
  toasts: Array<{ id: number; message: string; kind?: ToastKind }>;
  onClose: (id: number) => void;
}

function ToastContainer({ toasts, onClose }: ToastContainerProps) {
  if (typeof window === 'undefined') return null;

  return createPortal(
    <div className="fixed bottom-6 right-6 flex flex-col gap-2 z-[200] pointer-events-none">
      {toasts.map(t => (
        <div key={t.id} className="pointer-events-auto">
          <ToastItem message={t.message} kind={t.kind} onClose={() => onClose(t.id)} />
        </div>
      ))}
    </div>,
    document.body
  );
}

let toastId = 0;
const listeners: Array<(toasts: Array<{ id: number; message: string; kind?: ToastKind }>) => void> = [];
let toasts: Array<{ id: number; message: string; kind?: ToastKind }> = [];

function notify() {
  listeners.forEach(l => l([...toasts]));
}

export function toast(message: string, kind: ToastKind = 'info') {
  const id = ++toastId;
  toasts = [...toasts, { id, message, kind }];
  notify();
  setTimeout(() => {
    toasts = toasts.filter(t => t.id !== id);
    notify();
  }, 3000);
}

export function useToast() {
  const [state, setState] = useState(toasts);
  
  useEffect(() => {
    listeners.push(setState);
    return () => {
      const idx = listeners.indexOf(setState);
      if (idx > -1) listeners.splice(idx, 1);
    };
  }, []);

  return { toasts: state, toast, dismiss: (id: number) => { toasts = toasts.filter(t => t.id !== id); notify(); } };
}

export { ToastContainer };