"use client";

import Image from "next/image";
import Link from "next/link";
import { Phone, ArrowUpRight, ShieldCheck, Clock, Users } from "lucide-react";
import { Reveal } from "@/components/Reveal";
import { site } from "@/lib/site";

const features = [
  { icon: ShieldCheck, text: "Diagnóstico preciso e seguro" },
  { icon: Clock, text: "Atendimento rápido e pontual" },
  { icon: Users, text: "Equipa médica especializada" },
];

export function About() {
  return (
    <section id="sobre" className="bg-white py-24">
      <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-4 lg:grid-cols-2">
        <Reveal>
          <div className="relative">
            <div className="relative h-[420px] overflow-hidden rounded-[2.5rem] shadow-card">
              <Image
                src="https://images.unsplash.com/photo-1538108149393-fbbd81895907?auto=format&fit=crop&w=900&q=80"
                alt="Edifício da Clínica Bem Estar"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 500px"
              />
            </div>
            <div className="absolute -bottom-6 -right-2 w-56 rounded-3xl bg-primary p-5 text-white shadow-card sm:right-6">
              <p className="text-xs uppercase tracking-wide text-white/70">
                Desde
              </p>
              <p className="font-display text-3xl font-bold">2003</p>
              <p className="mt-1 text-sm text-white/80">
                Comprometidos com a sua saúde e bem-estar.
              </p>
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.15}>
          <div>
            <span className="badge bg-accent/10 text-accent">Sobre Nós</span>
            <h2 className="mt-3 font-display text-4xl font-bold leading-tight text-ink">
              A SUA CLÍNICA DE
              <br />
              CONFIANÇA
            </h2>
            <p className="mt-4 leading-relaxed text-body">
              Na Clínica Bem Estar combinamos competência clínica, tecnologia
              inovadora e uma abordagem que coloca o paciente em primeiro lugar.
              O nosso objetivo é garantir um diagnóstico rigoroso e um tratamento
              verdadeiramente eficaz para cada pessoa que nos procura.
            </p>

            <ul className="mt-6 space-y-3">
              {features.map((f) => (
                <li key={f.text} className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/10 text-accent">
                    <f.icon size={18} />
                  </span>
                  <span className="text-sm font-medium text-ink">{f.text}</span>
                </li>
              ))}
            </ul>

            <div className="mt-8 flex flex-wrap items-center gap-5">
              <Link href="/contacto" className="btn-primary">
                Falar connosco <ArrowUpRight size={16} />
              </Link>
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-50 text-primary">
                  <Phone size={18} />
                </span>
                <div>
                  <p className="text-xs text-body">Para qualquer questão</p>
                  <p className="font-semibold text-ink">{site.phone}</p>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
