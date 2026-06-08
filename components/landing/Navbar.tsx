"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, HeartPulse, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "#inicio", label: "Início" },
  { href: "#servicos", label: "Especialidades" },
  { href: "#sobre", label: "Sobre" },
  { href: "#estatisticas", label: "Resultados" },
  { href: "#contacto", label: "Contacto" },
];

export function Navbar() {
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
          scrolled
            ? "bg-white/80 shadow-glass backdrop-blur-xl"
            : "bg-white/40 backdrop-blur-md",
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
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="rounded-full px-4 py-2 text-sm font-medium text-body transition-colors hover:bg-primary-50 hover:text-primary"
            >
              {l.label}
            </a>
          ))}
        </div>

        <div className="hidden items-center gap-2 md:flex">
          <Link href="/login" className="btn-ghost px-5 py-2.5">
            Entrar
          </Link>
          <a href="#contacto" className="btn-primary px-5 py-2.5">
            Agendar Consulta <ArrowUpRight size={16} />
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
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="block rounded-xl px-4 py-3 text-sm font-medium text-body hover:bg-primary-50"
            >
              {l.label}
            </a>
          ))}
          <div className="mt-2 flex flex-col gap-2">
            <Link href="/login" className="btn-ghost w-full">
              Entrar
            </Link>
            <a href="#contacto" className="btn-primary w-full">
              Agendar Consulta
            </a>
          </div>
        </motion.div>
      )}
    </motion.header>
  );
}
