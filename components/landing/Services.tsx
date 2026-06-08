"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Brain,
  HeartPulse,
  Bone,
  Baby,
  Microscope,
  ShieldPlus,
  Activity,
  Stethoscope,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";
import { Reveal } from "@/components/Reveal";
import { whatsappFor } from "@/lib/site";

type Service = { icon: LucideIcon; title: string; desc: string };

const services: Service[] = [
  { icon: HeartPulse, title: "Cardiologia", desc: "Diagnóstico e tratamento de doenças do coração com eletrocardiograma, ecocardiografia e acompanhamento contínuo." },
  { icon: Brain, title: "Neurologia", desc: "Avaliação de cefaleias, epilepsia e doenças neurodegenerativas com tecnologia de diagnóstico avançada." },
  { icon: Bone, title: "Ortopedia", desc: "Tratamento de lesões ósseas e articulares, traumatologia, reabilitação e medicina desportiva." },
  { icon: Baby, title: "Pediatria", desc: "Acompanhamento dedicado do crescimento e bem-estar das crianças, da primeira infância à adolescência." },
  { icon: Microscope, title: "Análises Clínicas", desc: "Laboratório próprio com resultados rápidos e fiáveis para um diagnóstico preciso e atempado." },
  { icon: ShieldPlus, title: "Oncologia", desc: "Rastreio, diagnóstico precoce e acompanhamento multidisciplinar do paciente oncológico." },
  { icon: Activity, title: "Fisioterapia", desc: "Reabilitação funcional e tratamento da dor com planos personalizados para uma recuperação eficaz." },
  { icon: Stethoscope, title: "Medicina Geral", desc: "Consultas de rotina, prevenção e gestão de doenças crónicas para toda a família." },
];

export function Services({ compact = false }: { compact?: boolean }) {
  const list = compact ? services.slice(0, 4) : services;

  return (
    <section className="relative overflow-hidden py-24">
      {/* fundo: sala de operações com sobreposição escura */}
      <div className="absolute inset-0">
        <Image
          src="https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&w=1600&q=80"
          alt="Bloco operatório da Clínica Bem Estar"
          fill
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#02152c]/95 via-[#042a52]/95 to-[#02152c]/97" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <span className="badge bg-accent/15 text-accent">Especialidades</span>
            <h2 className="mt-3 font-display text-4xl font-bold text-accent sm:text-5xl">
              Centro de Excelência
            </h2>
            <p className="mt-3 text-white/70">
              Uma equipa multidisciplinar e tecnologia de ponta ao serviço da sua
              saúde, em todas as fases da vida.
            </p>
          </div>
        </Reveal>

        <div className="mt-14 grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((s, i) => (
            <Reveal key={s.title} delay={(i % 3) * 0.08}>
              <motion.div
                whileHover={{ y: -6 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="group flex flex-col items-center text-center"
              >
                <span className="flex h-20 w-20 items-center justify-center rounded-2xl border border-white/15 bg-white/5 text-white shadow-[0_8px_30px_rgba(0,196,140,0.15)] transition-colors group-hover:border-accent/60 group-hover:text-accent">
                  <s.icon size={36} strokeWidth={1.5} />
                </span>
                <h3 className="mt-5 font-display text-xl font-bold text-accent">
                  {s.title}
                </h3>
                <p className="mt-2 max-w-xs text-sm leading-relaxed text-white/70">
                  {s.desc}
                </p>
                <a
                  href={whatsappFor(s.title)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-5 inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2 text-xs font-bold uppercase tracking-wide text-white transition-all hover:bg-accent-dark active:scale-95"
                >
                  Saber mais <ArrowRight size={14} />
                </a>
              </motion.div>
            </Reveal>
          ))}
        </div>

        {compact && (
          <div className="mt-14 text-center">
            <Link
              href="/especialidades"
              className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition-all hover:border-accent/60 hover:text-accent"
            >
              Ver todas as especialidades <ArrowRight size={16} />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
