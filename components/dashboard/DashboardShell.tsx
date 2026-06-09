"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  HeartPulse,
  LogOut,
  Menu,
  X,
  Bell,
  Home,
} from "lucide-react";
import { Role } from "@prisma/client";
import { navByRole, roleLabels } from "@/components/dashboard/nav";
import { cn, initials } from "@/lib/utils";
import { NotificationBell } from "@/components/dashboard/NotificationBell";

export function DashboardShell({
  role,
  name,
  email,
  children,
}: {
  role: Role;
  name: string;
  email: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const nav = navByRole[role];

  const SidebarContent = (
    <div className="flex h-full flex-col">
      <Link href="/" className="flex items-center gap-2 px-2 py-4">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white">
          <HeartPulse size={18} />
        </span>
        <div>
          <p className="font-display text-sm font-bold leading-none text-ink">
            Bem Estar
          </p>
          <p className="text-[11px] text-body">{roleLabels[role]}</p>
        </div>
      </Link>

      <nav className="mt-4 flex-1 space-y-1 px-1">
        {nav.map((item) => {
          const active =
            item.href === `/${role.toLowerCase()}`
              ? pathname === item.href
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={cn("sidebar-link", active && "sidebar-link-active")}
            >
              <item.icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto space-y-1 border-t border-gray-100 px-1 pt-3">
        <Link href="/" className="sidebar-link">
          <Home size={18} /> Ver site
        </Link>
        <button
          onClick={async () => {
            await signOut({ redirect: false });
            window.location.href = "/login";
          }}
          className="sidebar-link w-full text-left text-red-500 hover:bg-red-50 hover:text-red-600"
        >
          <LogOut size={18} /> Terminar sessão
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-surface">
      {/* desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-gray-100 bg-white px-3 py-2 lg:block">
        {SidebarContent}
      </aside>

      {/* mobile drawer */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-ink/30 lg:hidden"
              onClick={() => setOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed inset-y-0 left-0 z-50 w-64 bg-white px-3 py-2 lg:hidden"
            >
              {SidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* main */}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-gray-100 bg-white/80 px-4 py-3 backdrop-blur-md">
          <button
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary lg:hidden"
            onClick={() => setOpen(true)}
            aria-label="Abrir menu"
          >
            <Menu size={20} />
          </button>

          <div className="hidden lg:block">
            <p className="text-sm text-body">Bem-vindo(a),</p>
            <p className="font-display font-bold text-ink">{name}</p>
          </div>

          <div className="flex items-center gap-3">
            <NotificationBell />
            <div className="flex items-center gap-2 rounded-full bg-primary-50 py-1 pl-1 pr-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
                {initials(name)}
              </span>
              <span className="hidden text-sm font-medium text-ink sm:block">
                {email}
              </span>
            </div>
          </div>
        </header>

        <main className="p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
