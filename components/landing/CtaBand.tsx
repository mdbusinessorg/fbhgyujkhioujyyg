"use client";

import { ArrowUpRight } from "lucide-react";
import { Reveal } from "@/components/Reveal";
import { site } from "@/lib/site";
import { WhatsAppIcon } from "@/components/landing/WhatsAppFloat";

export function CtaBand() {
  return (
    <section className="bg-surface py-20">
      <div className="mx-auto max-w-5xl px-4">
        <Reveal>
          <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-primary to-primary-700 px-8 py-14 text-center shadow-card">
            <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
            <h2 className="font-display text-3xl font-bold text-white sm:text-4xl">
              Pronto para cuidar da sua saúde?
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-white/80">
              Marque a sua consulta em segundos pelo WhatsApp. A nossa equipa
              responde rapidamente, todos os dias.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <a
                href={site.whatsappBooking}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#25D366] px-7 py-3.5 text-sm font-semibold text-white transition-all hover:bg-[#1ebe5b] active:scale-95"
              >
                <WhatsAppIcon size={18} /> Agendar no WhatsApp
              </a>
              <a
                href={`tel:+${site.phoneRaw}`}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-white/15 px-7 py-3.5 text-sm font-semibold text-white backdrop-blur transition-all hover:bg-white/25 active:scale-95"
              >
                Ligar {site.phone} <ArrowUpRight size={16} />
              </a>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
