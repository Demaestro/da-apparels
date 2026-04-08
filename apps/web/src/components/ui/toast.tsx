"use client";

import { create } from "zustand";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect } from "react";

type ToastType = "success" | "error" | "info";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastStore {
  toasts: Toast[];
  show: (message: string, type?: ToastType) => void;
  dismiss: (id: string) => void;
}

export const useToast = create<ToastStore>((set) => ({
  toasts: [],
  show: (message, type = "info") => {
    const id = Math.random().toString(36).slice(2);
    set((s) => ({ toasts: [...s.toasts, { id, message, type }] }));
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), 4000);
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

const ICONS: Record<ToastType, string> = {
  success: "✓",
  error: "✕",
  info: "·",
};

const STYLES: Record<ToastType, string> = {
  success: "border-gold/40 bg-obsidian text-gold",
  error: "border-error/40 bg-obsidian text-error",
  info: "border-gold/20 bg-obsidian text-ivory-warm",
};

export function ToastContainer() {
  const { toasts, dismiss } = useToast();

  return (
    <div className="fixed bottom-6 right-4 sm:right-6 z-[100] flex flex-col gap-2 items-end">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, x: 40, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 40, scale: 0.95 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className={`flex items-center gap-3 border px-5 py-3 font-sans text-xs tracking-wide min-w-[200px] max-w-[320px] cursor-pointer ${STYLES[t.type]}`}
            onClick={() => dismiss(t.id)}
          >
            <span className="font-bold">{ICONS[t.type]}</span>
            <span>{t.message}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
