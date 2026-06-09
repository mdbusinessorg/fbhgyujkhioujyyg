"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Stethoscope, Pill, FlaskConical, MessageSquare, ClipboardList, CheckCheck } from "lucide-react";

type ApptOption = {
  id: string;
  label: string;
  consultationId: string | null;
  completed: boolean;
};

const tabs = [
  { key: "notes", label: "Notas", icon: Stethoscope },
  { key: "prescription", label: "Receita", icon: Pill },
  { key: "exam", label: "Exame", icon: FlaskConical },
  { key: "plan", label: "Plano", icon: ClipboardList },
  { key: "message", label: "Mensagem", icon: MessageSquare },
] as const;

export function ClinicalWorkspace({
  patientId,
  appointments,
}: {
  patientId: string;
  appointments: ApptOption[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<(typeof tabs)[number]["key"]>("notes");
  const [apptId, setApptId] = useState(appointments[0]?.id ?? "");
  const [consultationId, setConsultationId] = useState<string | null>(
    appointments[0]?.consultationId ?? null,
  );
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  function onSelectAppt(id: string) {
    setApptId(id);
    const a = appointments.find((x) => x.id === id);
    setConsultationId(a?.consultationId ?? null);
  }

  async function ensureConsultation(notes?: string): Promise<string | null> {
    if (consultationId) {
      if (notes !== undefined) {
        await fetch("/api/doctor/consultations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ appointmentId: apptId, clinicalNotes: notes }),
        });
      }
      return consultationId;
    }
    const res = await fetch("/api/doctor/consultations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ appointmentId: apptId, clinicalNotes: notes ?? "" }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Erro");
    setConsultationId(data.id);
    return data.id;
  }

  async function submit(e: React.FormEvent<HTMLFormElement>, kind: string) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const form = new FormData(e.currentTarget);
    try {
      if (!apptId && kind !== "message" && kind !== "plan") {
        throw new Error("Selecione uma marcação");
      }
      if (kind === "notes") {
        await ensureConsultation(String(form.get("clinicalNotes")));
      } else if (kind === "prescription") {
        const cid = await ensureConsultation();
        const res = await fetch("/api/doctor/prescriptions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ consultationId: cid, ...Object.fromEntries(form.entries()) }),
        });
        if (!res.ok) throw new Error((await res.json()).error || "Erro");
      } else if (kind === "exam") {
        const cid = await ensureConsultation();
        const res = await fetch("/api/doctor/exams", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ consultationId: cid, ...Object.fromEntries(form.entries()) }),
        });
        if (!res.ok) throw new Error((await res.json()).error || "Erro");
      } else if (kind === "message") {
        const res = await fetch("/api/doctor/message", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ patientId, message: form.get("message") }),
        });
        if (!res.ok) throw new Error((await res.json()).error || "Erro");
      } else if (kind === "plan") {
        const res = await fetch("/api/doctor/treatment-plan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ patientId, ...Object.fromEntries(form.entries()) }),
        });
        if (!res.ok) throw new Error((await res.json()).error || "Erro");
      }
      setMsg({ type: "ok", text: "Guardado com sucesso." });
      (e.target as HTMLFormElement).reset();
      router.refresh();
    } catch (err) {
      setMsg({ type: "err", text: err instanceof Error ? err.message : "Erro" });
    } finally {
      setBusy(false);
    }
  }

  async function completeConsultation() {
    if (!consultationId) {
      setMsg({ type: "err", text: "Registe notas antes de concluir." });
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/doctor/consultations/${consultationId}/complete`, { method: "POST" });
      if (!res.ok) throw new Error((await res.json()).error || "Erro");
      setMsg({ type: "ok", text: "Consulta concluída." });
      router.refresh();
    } catch (err) {
      setMsg({ type: "err", text: err instanceof Error ? err.message : "Erro" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl bg-white p-5 shadow-soft">
      <h3 className="font-display text-lg font-semibold text-ink">Ações clínicas</h3>

      {(tab === "notes" || tab === "prescription" || tab === "exam") && (
        <div className="mt-3">
          <label className="label">Marcação</label>
          <select value={apptId} onChange={(e) => onSelectAppt(e.target.value)} className="input">
            {appointments.length === 0 && <option value="">Sem marcações</option>}
            {appointments.map((a) => (
              <option key={a.id} value={a.id}>{a.label}{a.completed ? " (concluída)" : ""}</option>
            ))}
          </select>
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-1 rounded-xl bg-surface p-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => { setTab(t.key); setMsg(null); }}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
              tab === t.key ? "bg-white text-primary shadow-soft" : "text-body hover:text-ink"
            }`}
          >
            <t.icon size={14} /> {t.label}
          </button>
        ))}
      </div>

      <div className="mt-4">
        {tab === "notes" && (
          <form onSubmit={(e) => submit(e, "notes")} className="space-y-3">
            <textarea name="clinicalNotes" rows={5} required className="input resize-none" placeholder="Resumo da consulta, observações clínicas..." />
            <button disabled={busy} className="btn-primary w-full">{busy ? <Loader2 className="animate-spin" size={16} /> : "Guardar notas"}</button>
          </form>
        )}
        {tab === "prescription" && (
          <form onSubmit={(e) => submit(e, "prescription")} className="space-y-3">
            <input name="medicationName" required className="input" placeholder="Medicamento" />
            <div className="grid grid-cols-2 gap-3">
              <input name="dosage" required className="input" placeholder="Dose (ex: 500mg)" />
              <input name="frequency" required className="input" placeholder="Frequência (ex: 2x/dia)" />
            </div>
            <input name="durationDays" type="number" required className="input" placeholder="Duração (dias)" />
            <textarea name="instructions" rows={2} className="input resize-none" placeholder="Instruções especiais" />
            <button disabled={busy} className="btn-primary w-full">{busy ? <Loader2 className="animate-spin" size={16} /> : "Prescrever"}</button>
          </form>
        )}
        {tab === "exam" && (
          <form onSubmit={(e) => submit(e, "exam")} className="space-y-3">
            <input name="examName" required className="input" placeholder="Nome do exame" />
            <select name="urgency" className="input" defaultValue="ROTINA">
              <option value="ROTINA">Rotina</option>
              <option value="PRIORITARIO">Prioritário</option>
              <option value="URGENTE">Urgente</option>
            </select>
            <textarea name="notes" rows={2} className="input resize-none" placeholder="Notas" />
            <button disabled={busy} className="btn-primary w-full">{busy ? <Loader2 className="animate-spin" size={16} /> : "Solicitar exame"}</button>
          </form>
        )}
        {tab === "plan" && (
          <form onSubmit={(e) => submit(e, "plan")} className="space-y-3">
            <input name="title" required className="input" placeholder="Título do plano" />
            <textarea name="description" rows={2} className="input resize-none" placeholder="Descrição" />
            <textarea name="goals" rows={3} className="input resize-none" placeholder="Objetivos (um por linha)" />
            <input name="endDate" type="date" className="input" />
            <button disabled={busy} className="btn-primary w-full">{busy ? <Loader2 className="animate-spin" size={16} /> : "Criar plano"}</button>
          </form>
        )}
        {tab === "message" && (
          <form onSubmit={(e) => submit(e, "message")} className="space-y-3">
            <textarea name="message" rows={4} required className="input resize-none" placeholder="Escreva uma mensagem para o paciente..." />
            <button disabled={busy} className="btn-primary w-full">{busy ? <Loader2 className="animate-spin" size={16} /> : "Enviar mensagem"}</button>
          </form>
        )}
      </div>

      {tab !== "message" && tab !== "plan" && (
        <button onClick={completeConsultation} disabled={busy} className="btn-accent mt-3 w-full">
          <CheckCheck size={16} /> Concluir consulta
        </button>
      )}

      {msg && (
        <p className={`mt-3 rounded-xl px-4 py-2 text-sm ${msg.type === "ok" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>
          {msg.text}
        </p>
      )}
    </div>
  );
}
