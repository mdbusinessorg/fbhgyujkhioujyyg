"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, X } from "lucide-react";

export function CreateDoctorForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(e.currentTarget);
    const payload = Object.fromEntries(form.entries());
    try {
      const res = await fetch("/api/admin/doctors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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
        <Plus size={16} /> Novo médico
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-card">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-lg font-bold text-ink">Adicionar médico</h3>
          <button onClick={() => setOpen(false)} className="text-body hover:text-ink">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={onSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Nome</label><input name="name" required className="input" /></div>
            <div><label className="label">CRM / Cédula</label><input name="crm" required className="input" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Email</label><input name="email" type="email" required className="input" /></div>
            <div><label className="label">Telefone</label><input name="phone" className="input" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Especialidade</label><input name="specialty" required className="input" placeholder="Ex: Cardiologia" /></div>
            <div><label className="label">Palavra-passe</label><input name="password" type="password" required minLength={6} className="input" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Dias disponíveis</label><input name="availableDays" className="input" placeholder="Seg-Sex" /></div>
            <div><label className="label">Horário</label><input name="availableHours" className="input" placeholder="09:00-17:00" /></div>
          </div>
          <div><label className="label">Biografia</label><textarea name="bio" rows={2} className="input resize-none" /></div>
          {error && <p className="rounded-xl bg-red-50 px-4 py-2 text-sm text-red-600">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setOpen(false)} className="btn-ghost">Cancelar</button>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? <><Loader2 className="animate-spin" size={16} /> A guardar...</> : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
