"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, X } from "lucide-react";

type Option = { id: string; name: string; extra?: string };

export function CreateAppointmentForm({
  patients,
  doctors,
}: {
  patients: Option[];
  doctors: Option[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/admin/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(form.entries())),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro");
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro");
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn-primary">
        <Plus size={16} /> Nova consulta
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-card">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-lg font-bold text-ink">Agendar consulta</h3>
          <button onClick={() => setOpen(false)} className="text-body hover:text-ink"><X size={20} /></button>
        </div>
        <form onSubmit={onSubmit} className="space-y-3">
          <div>
            <label className="label">Paciente</label>
            <select name="patientId" required className="input">
              <option value="">Selecione...</option>
              {patients.map((p) => <option key={p.id} value={p.id}>{p.name}{p.extra ? ` (${p.extra})` : ""}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Médico</label>
            <select name="doctorId" required className="input">
              <option value="">Selecione...</option>
              {doctors.map((d) => <option key={d.id} value={d.id}>{d.name}{d.extra ? ` — ${d.extra}` : ""}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Data e hora</label>
            <input name="dateTime" type="datetime-local" required className="input" />
          </div>
          <div>
            <label className="label">Motivo</label>
            <input name="reason" className="input" placeholder="Motivo da consulta" />
          </div>
          {error && <p className="rounded-xl bg-red-50 px-4 py-2 text-sm text-red-600">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setOpen(false)} className="btn-ghost">Cancelar</button>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? <><Loader2 className="animate-spin" size={16} /> A guardar...</> : "Agendar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
