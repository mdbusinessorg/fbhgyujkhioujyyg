"use client";

import { CountUp } from "@/components/CountUp";
import { Reveal } from "@/components/Reveal";

const stats = [
  { value: 48000, suffix: "+", label: "Consultas Realizadas" },
  { value: 20000, suffix: "+", label: "Pacientes Atendidos" },
  { value: 95, suffix: "%", label: "Taxa de Satisfação" },
  { value: 200, suffix: "+", label: "Profissionais de Saúde" },
];

export function StatsBar() {
  return (
    <section
      id="estatisticas"
      className="bg-gradient-to-r from-primary to-primary-600 py-16"
    >
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-4 lg:grid-cols-4">
        {stats.map((s, i) => (
          <Reveal key={s.label} delay={i * 0.1}>
            <div className="rounded-2xl bg-white/10 p-6 text-center backdrop-blur-sm">
              <p className="font-display text-4xl font-extrabold text-white">
                <CountUp end={s.value} suffix={s.suffix} />
              </p>
              <p className="mt-2 text-sm font-medium text-white/80">
                {s.label}
              </p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
