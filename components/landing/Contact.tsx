"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Reveal } from "@/components/Reveal";
import { CheckCircle2, Loader2, MapPin, Mail, Phone, ArrowUpRight } from "lucide-react";

type DoctorOption = { id: string; name: string; specialty: string };

export function Contact() {
  const [doctors, setDoctors] = useState<DoctorOption[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">(
    "idle",
  );
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/public/doctors")
      .then((r) => r.json())
      .then((d) => setDoctors(d.doctors ?? []))
      .catch(() => setDoctors([]));
  }, []);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setError("");
    const form = new FormData(e.currentTarget);
    const payload = Object.fromEntries(form.entries());
    try {
      const res = await fetch("/api/public/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao agendar");
      setStatus("ok");
      (e.target as HTMLFormElement).reset();
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Erro inesperado");
    }
  }

  return (
    <section id="contacto" className="bg-surface py-24">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-4 lg:grid-cols-2">
        <Reveal>
          <div>
            <span className="badge bg-accent/10 text-accent">Contacto</span>
            <h2 className="mt-3 font-display text-4xl font-bold text-ink">
              Agende a sua consulta
            </h2>
            <p className="mt-3 text-body">
              Preencha o formulário e a nossa equipa entrará em contacto para
              confirmar a data e a hora. É rápido e simples.
            </p>

            <div className="mt-8 space-y-4">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-50 text-primary">
                  <MapPin size={18} />
                </span>
                <div>
                  <p className="text-sm font-semibold text-ink">Morada</p>
                  <p className="text-sm text-body">
                    Av. da Liberdade 154, 1250-146 Lisboa
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-50 text-primary">
                  <Phone size={18} />
                </span>
                <div>
                  <p className="text-sm font-semibold text-ink">Telefone</p>
                  <p className="text-sm text-body">+351 211 234 567</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-50 text-primary">
                  <Mail size={18} />
                </span>
                <div>
                  <p className="text-sm font-semibold text-ink">Email</p>
                  <p className="text-sm text-body">geral@clinicabemestar.pt</p>
                </div>
              </div>
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.15}>
          <div className="glass-card bg-white/80 p-8">
            {status === "ok" ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-16 text-center"
              >
                <CheckCircle2 className="text-accent" size={56} />
                <h3 className="mt-4 font-display text-2xl font-bold text-ink">
                  Pedido recebido!
                </h3>
                <p className="mt-2 text-body">
                  A sua consulta foi registada. Entraremos em contacto para
                  confirmar. Se quiser acompanhar o estado, crie a sua conta.
                </p>
                <button
                  onClick={() => setStatus("idle")}
                  className="btn-ghost mt-6"
                >
                  Novo agendamento
                </button>
              </motion.div>
            ) : (
              <form onSubmit={onSubmit} className="space-y-4">
                <div>
                  <label className="label">Nome completo</label>
                  <input name="name" required className="input" placeholder="Ex: Ana Martins" />
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="label">Email</label>
                    <input
                      name="email"
                      type="email"
                      required
                      className="input"
                      placeholder="ana@email.pt"
                    />
                  </div>
                  <div>
                    <label className="label">Telefone</label>
                    <input name="phone" className="input" placeholder="+351 ..." />
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="label">Especialidade / Médico</label>
                    <select name="doctorId" required className="input">
                      <option value="">Selecione...</option>
                      {doctors.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.specialty} — Dr(a). {d.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label">Data e hora preferida</label>
                    <input
                      name="dateTime"
                      type="datetime-local"
                      required
                      className="input"
                    />
                  </div>
                </div>
                <div>
                  <label className="label">Motivo da consulta</label>
                  <textarea
                    name="reason"
                    rows={3}
                    className="input resize-none"
                    placeholder="Descreva brevemente o motivo..."
                  />
                </div>

                {status === "error" && (
                  <p className="rounded-xl bg-red-50 px-4 py-2 text-sm text-red-600">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={status === "loading"}
                  className="btn-primary w-full"
                >
                  {status === "loading" ? (
                    <>
                      <Loader2 className="animate-spin" size={16} /> A enviar...
                    </>
                  ) : (
                    <>
                      Agendar Consulta <ArrowUpRight size={16} />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
