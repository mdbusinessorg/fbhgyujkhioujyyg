import type { Metadata } from "next";
import { PageHero } from "@/components/landing/PageHero";
import { Services } from "@/components/landing/Services";
import { CtaBand } from "@/components/landing/CtaBand";

export const metadata: Metadata = {
  title: "Especialidades — Clínica Bem Estar",
  description:
    "Conheça as especialidades médicas da Clínica Bem Estar em Luanda: cardiologia, neurologia, ortopedia, pediatria e muito mais.",
};

export default function EspecialidadesPage() {
  return (
    <>
      <PageHero
        badge="Especialidades"
        title="As nossas especialidades"
        subtitle="Uma equipa multidisciplinar e tecnologia de ponta ao serviço da sua saúde, em todas as fases da vida."
      />
      <Services />
      <CtaBand />
    </>
  );
}
