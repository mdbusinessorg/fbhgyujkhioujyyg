"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Award, HeartPulse, Activity, Stethoscope } from "lucide-react";
import { site } from "@/lib/site";
import { WhatsAppIcon } from "@/components/landing/WhatsAppFloat";

export function Hero() {
  return (
    <section
      id="inicio"
      className="relative overflow-hidden bg-hero-gradient pb-20 pt-32"
    >
      {/* decorative blobs */}
      <div className="pointer-events-none absolute -left-24 top-20 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 top-40 h-80 w-80 rounded-full bg-accent/10 blur-3xl" />

      {/* watermark title */}
      <h2 className="pointer-events-none absolute inset-x-0 top-16 select-none text-center font-display text-[12vw] font-extrabold leading-none text-white/40">
        BEM ESTAR
      </h2>

      <div className="relative mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 px-4 lg:grid-cols-2">
        {/* left: copy */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="relative z-10"
        >
          <span className="badge bg-white/80 text-primary shadow-soft">
            <Stethoscope size={14} /> Tratamento Rápido &amp; Preciso
          </span>

          <h1 className="mt-5 font-display text-5xl font-extrabold leading-[1.05] text-ink sm:text-6xl">
            CUIDADO
            <br />
            <span className="text-primary">INTELIGENTE</span>
            <br />
            PARA SI
          </h1>

          <p className="mt-5 max-w-md text-base leading-relaxed text-body">
            A <strong className="text-ink">Clínica Bem Estar</strong> reúne
            médicos dedicados, tecnologia de ponta e diagnóstico de precisão —
            tudo num só lugar, ao serviço da sua saúde.
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <a
              href={site.whatsappBooking}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#25D366] px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-[#1ebe5b] hover:shadow-card active:scale-95"
            >
              <WhatsAppIcon size={16} /> Agendar no WhatsApp
            </a>
            <Link href="/especialidades" className="btn-ghost">
              Ver Especialidades
            </Link>
          </div>

          <div className="mt-8 flex items-center gap-3 rounded-2xl bg-white/70 p-3 shadow-soft backdrop-blur-md">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white">
              <Award size={18} />
            </span>
            <div>
              <p className="text-lg font-bold leading-none text-ink">22 Anos</p>
              <p className="text-xs text-body">de Excelência Médica</p>
            </div>
          </div>
        </motion.div>

        {/* right: image + floating cards */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
          className="relative z-10 mx-auto h-[440px] w-full max-w-md"
        >
          <div className="absolute inset-0 overflow-hidden rounded-[2.5rem] rounded-tr-[6rem] border-4 border-white/70 shadow-card">
            <Image
              src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=800&q=80"
              alt="Médica da Clínica Bem Estar"
              fill
              priority
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 440px"
            />
          </div>

          {/* floating card: awards */}
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -left-4 top-10 flex items-center gap-2 rounded-2xl bg-white/90 p-3 shadow-glass backdrop-blur-md"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/15 text-accent">
              <Award size={16} />
            </span>
            <div>
              <p className="text-sm font-bold leading-none text-ink">490+</p>
              <p className="text-[11px] text-body">Prémios</p>
            </div>
          </motion.div>

          {/* floating card: healed */}
          <motion.div
            animate={{ y: [0, 12, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -right-3 bottom-24 flex items-center gap-2 rounded-2xl bg-white/90 p-3 shadow-glass backdrop-blur-md"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
              <HeartPulse size={16} />
            </span>
            <div>
              <p className="text-sm font-bold leading-none text-ink">6.700+</p>
              <p className="text-[11px] text-body">Pacientes Curados</p>
            </div>
          </motion.div>

          {/* floating card: satisfaction */}
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -bottom-3 left-8 flex items-center gap-2 rounded-2xl bg-white/90 p-3 shadow-glass backdrop-blur-md"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/15 text-accent">
              <Activity size={16} />
            </span>
            <div>
              <p className="text-sm font-bold leading-none text-ink">95%</p>
              <p className="text-[11px] text-body">Satisfação</p>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
