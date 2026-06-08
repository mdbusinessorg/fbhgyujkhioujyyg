"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { HeartPulse, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { site } from "@/lib/site";
import { WhatsAppIcon } from "@/components/landing/WhatsAppFloat";

const links = [
  { href: "/", label: "Início" },
  { href: "/especialidades", label: "Especialidades" },
  { href: "/sobre", label: "Sobre" },
  { href: "/contacto", label: "Contacto" },
];

export function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="fixed inset-x-0 top-0 z-50 px-4 pt-4"
    >
      <nav
        className={cn(
          "mx-auto flex max-w-6xl items-center justify-between rounded-full px-5 py-3 transition-all",
          scrolled ? "bg-white/80 shadow-glass backdrop-blur-xl" : "bg-white/40 backdrop-blur-md",
        )}
      >
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white">
            <HeartPulse size={18} />
          </span>
          <span className="font-display text-lg font-bold text-ink">
            Clínica <span className="text-primary">Bem Estar</span>
          </span>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {links.map((l) => {
            const active = l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-medium transition-colors",
                  active ? "bg-primary-50 text-primary" : "text-body hover:bg-primary-50 hover:text-primary",
                )}
              >
                {l.label}
              </Link>
            );
          })}
        </div>

        <div className="hidden items-center gap-2 md:flex">
          <Link href="/login" className="btn-ghost px-5 py-2.5">
            Entrar
          </Link>
          <a href={site.whatsappBooking} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 rounded-full bg-[#25D366] px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-[#1ebe5b] active:scale-95">
            <WhatsAppIcon size={16} /> Agendar
          </a>
        </div>

        <button
          className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-50 text-primary md:hidden"
          onClick={() => setOpen((o) => !o)}
          aria-label="Menu"
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </nav>

      {open && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto mt-2 max-w-6xl rounded-3xl bg-white/95 p-4 shadow-glass backdrop-blur-xl md:hidden"
        >
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="block rounded-xl px-4 py-3 text-sm font-medium text-body hover:bg-primary-50"
            >
              {l.label}
            </Link>
          ))}
          <div className="mt-2 flex flex-col gap-2">
            <Link href="/login" onClick={() => setOpen(false)} className="btn-ghost w-full">
              Entrar
            </Link>
            <a href={site.whatsappBooking} target="_blank" rel="noopener noreferrer" className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#25D366] px-6 py-3 text-sm font-semibold text-white">
              <WhatsAppIcon size={16} /> Agendar no WhatsApp
            </a>
          </div>
        </motion.div>
      )}
    </motion.header>
  );
}
