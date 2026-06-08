"use client";

import { motion } from "framer-motion";
import { ArrowUpRight, Brain, HeartPulse, Activity, Bone, Baby, Stethoscope } from "lucide-react";
import { Reveal } from "@/components/Reveal";
import Link from "next/link";

const services = [
  {
    icon: Brain,
    title: "Neurologia",
    desc: "Avaliação e tratamento de doenças do sistema nervoso com tecnologia avançada de diagnóstico.",
    highlight: false,
    img: "https://images.unsplash.com/photo-1559757175-5700dde675bc?auto=format&fit=crop&w=600&q=80",
  },
  {
    icon: HeartPulse,
    title: "Cardiologia",
    desc: "Cuidado completo do coração: eletrocardiogramas, ecocardiografia e acompanhamento contínuo.",
    highlight: true,
    img: "https://images.unsplash.com/photo-1628348070889-cb656235b4eb?auto=format&fit=crop&w=600&q=80",
  },
  {
    icon: Activity,
    title: "Análises Clínicas",
    desc: "Laboratório próprio com resultados rápidos e fiáveis para um diagnóstico preciso.",
    highlight: false,
    img: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=600&q=80",
  },
  {
    icon: Bone,
    title: "Ortopedia",
    desc: "Tratamento de lesões ósseas e articulares, reabilitação e medicina desportiva.",
    highlight: false,
    img: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=600&q=80",
  },
  {
    icon: Baby,
    title: "Pediatria",
    desc: "Acompanhamento dedicado do crescimento e bem-estar dos mais pequenos.",
    highlight: false,
    img: "https://images.unsplash.com/photo-1632053002928-1919d9b3a98e?auto=format&fit=crop&w=600&q=80",
  },
  {
    icon: Stethoscope,
    title: "Medicina Geral",
    desc: "Consultas de rotina, prevenção e gestão de doenças crónicas para toda a família.",
    highlight: false,
    img: "https://images.unsplash.com/photo-1666214280557-f1b5022eb634?auto=format&fit=crop&w=600&q=80",
  },
];

export function Services() {
  return (
    <section id="servicos" className="bg-surface py-24">
      <div className="mx-auto max-w-6xl px-4">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <span className="badge bg-accent/10 text-accent">
              Especialidades
            </span>
            <h2 className="mt-3 font-display text-4xl font-bold text-ink">
              Cuidados de saúde abrangentes
            </h2>
            <p className="mt-3 text-body">
              Uma equipa multidisciplinar pronta para cuidar de si em todas as
              fases da vida.
            </p>
          </div>
        </Reveal>

        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((s, i) => (
            <Reveal key={s.title} delay={i * 0.08}>
              <motion.div
                whileHover={{ y: -8 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className={`group relative h-full overflow-hidden rounded-3xl p-6 shadow-soft transition-shadow hover:shadow-card ${
                  s.highlight
                    ? "bg-primary text-white"
                    : "bg-white text-ink"
                }`}
              >
                <div className="flex items-start justify-between">
                  <span
                    className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
                      s.highlight
                        ? "bg-white/15 text-white"
                        : "bg-primary-50 text-primary"
                    }`}
                  >
                    <s.icon size={22} />
                  </span>
                  <Link
                    href="#contacto"
                    aria-label={`Agendar ${s.title}`}
                    className={`flex h-9 w-9 items-center justify-center rounded-full transition-transform group-hover:rotate-45 ${
                      s.highlight
                        ? "bg-white text-primary"
                        : "bg-accent text-white"
                    }`}
                  >
                    <ArrowUpRight size={16} />
                  </Link>
                </div>

                <h3 className="mt-5 font-display text-xl font-bold">
                  {s.title}
                </h3>
                <p
                  className={`mt-2 text-sm leading-relaxed ${
                    s.highlight ? "text-white/80" : "text-body"
                  }`}
                >
                  {s.desc}
                </p>
              </motion.div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
