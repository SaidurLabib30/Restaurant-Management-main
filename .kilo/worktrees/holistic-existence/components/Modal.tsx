'use client';

import { ReactNode, useEffect, useState } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  wide?: boolean;
  children: ReactNode;
  persistent?: boolean;
}

export default function Modal({ isOpen, onClose, wide, children, persistent }: ModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-ink/50 flex items-center justify-center z-[100] p-5 animate-fade-in"
      onClick={persistent ? undefined : onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className={`bg-surface rounded-2xl shadow-[0_20px_50px_rgba(34,32,29,0.18)] w-full max-h-[88vh] overflow-y-auto animate-pop-in ${wide ? 'w-[680px]' : 'w-[460px]'}`}
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}