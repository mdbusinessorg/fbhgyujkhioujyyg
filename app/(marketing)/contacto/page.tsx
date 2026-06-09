import type { Metadata } from "next";
import { PageHero } from "@/components/landing/PageHero";
import { Contact } from "@/components/landing/Contact";

export const metadata: Metadata = {
  title: "Contacto — Clínica Bem Estar",
  description:
    "Agende a sua consulta na Clínica Bem Estar em Luanda. Marque pelo WhatsApp ou preencha o formulário.",
};

export default function ContactoPage() {
  return (
    <>
      <PageHero
        badge="Contacto"
        title="Fale connosco"
        subtitle="Marque a sua consulta pelo WhatsApp ou preencha o formulário — a nossa equipa entrará em contacto para confirmar."
      />
      <Contact />
    </>
  );
}
