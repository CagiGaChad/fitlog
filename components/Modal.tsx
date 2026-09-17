"use client";

import { createPortal } from "react-dom";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";

export function Modal({ onClose, children }: { onClose: () => void; children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[90] bg-black/60 flex items-end justify-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-[520px] bg-surface rounded-t-2xl p-5 pb-[calc(24px+var(--safe-bottom))] max-h-[85vh] overflow-y-auto"
        style={{ animation: "modal-up 0.18s ease-out" }}
      >
        {children}
      </div>
      <style>{`
        @keyframes modal-up {
          from { transform: translateY(16px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>,
    document.body
  );
}
