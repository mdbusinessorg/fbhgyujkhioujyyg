import type { Metadata } from "next";
import { PageHero } from "@/components/landing/PageHero";
import { About } from "@/components/landing/About";
import { StatsBar } from "@/components/landing/StatsBar";
import { CtaBand } from "@/components/landing/CtaBand";

export const metadata: Metadata = {
  title: "Sobre — Clínica Bem Estar",
  description:
    "A Clínica Bem Estar combina competência clínica, tecnologia inovadora e uma abordagem centrada no paciente, em Luanda.",
};

export default function SobrePage() {
  return (
    <>
      <PageHero
        badge="Sobre Nós"
        title="Quem somos"
        subtitle="Cuidados de saúde de excelência, centrados em si — ao serviço da comunidade desde 2003."
      />
      <About />
      <StatsBar />
      <CtaBand />
    </>
  );
}
