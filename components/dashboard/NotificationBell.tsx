"use client";

import { useEffect, useState, useCallback } from "react";
import { Bell, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type Notif = {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  type: string;
  createdAt: string;
  link?: string | null;
};

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notif[]>([]);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications");
      if (!res.ok) return;
      const data = await res.json();
      setItems(data.notifications ?? []);
    } catch {
      /* noop */
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, [load]);

  const unread = items.filter((i) => !i.isRead).length;

  async function markAll() {
    await fetch("/api/notifications", { method: "POST" });
    setItems((prev) => prev.map((i) => ({ ...i, isRead: true })));
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary"
        aria-label="Notificações"
      >
        <Bell size={18} />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unread}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-card"
            >
              <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                <p className="font-semibold text-ink">Notificações</p>
                {unread > 0 && (
                  <button
                    onClick={markAll}
                    className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                  >
                    <Check size={14} /> Marcar lidas
                  </button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto">
                {items.length === 0 ? (
                  <p className="px-4 py-8 text-center text-sm text-body">
                    Sem notificações.
                  </p>
                ) : (
                  items.map((n) => (
                    <div
                      key={n.id}
                      className={`border-b border-gray-50 px-4 py-3 ${
                        n.isRead ? "bg-white" : "bg-primary-50/40"
                      }`}
                    >
                      <p className="text-sm font-semibold text-ink">{n.title}</p>
                      <p className="mt-0.5 text-xs text-body">{n.message}</p>
                      <p className="mt-1 text-[10px] text-gray-400">
                        {new Date(n.createdAt).toLocaleString("pt-PT")}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
