"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";

type Profile = {
  dob?: string;
  gender?: string;
  address?: string;
  bloodType?: string;
  allergies?: string;
  chronicConditions?: string;
  emergencyContact?: string;
};

export function ProfileForm({ initial }: { initial: Profile }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    const form = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/patient/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(form.entries())),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Erro");
      setMsg({ type: "ok", text: "Perfil atualizado com sucesso." });
      router.refresh();
    } catch (err) {
      setMsg({ type: "err", text: err instanceof Error ? err.message : "Erro" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Data de nascimento</label>
          <input name="dob" type="date" defaultValue={initial.dob} className="input" />
        </div>
        <div>
          <label className="label">Género</label>
          <select name="gender" defaultValue={initial.gender || ""} className="input">
            <option value="">Selecione...</option>
            <option value="Feminino">Feminino</option>
            <option value="Masculino">Masculino</option>
            <option value="Outro">Outro</option>
          </select>
        </div>
      </div>
      <div>
        <label className="label">Morada</label>
        <input name="address" defaultValue={initial.address} className="input" placeholder="Rua, número, código postal, cidade" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Tipo sanguíneo</label>
          <select name="bloodType" defaultValue={initial.bloodType || ""} className="input">
            <option value="">Selecione...</option>
            {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Contacto de emergência</label>
          <input name="emergencyContact" defaultValue={initial.emergencyContact} className="input" placeholder="Nome e telefone" />
        </div>
      </div>
      <div>
        <label className="label">Alergias</label>
        <textarea name="allergies" defaultValue={initial.allergies} rows={2} className="input resize-none" placeholder="Ex: Penicilina, frutos secos..." />
      </div>
      <div>
        <label className="label">Condições crónicas</label>
        <textarea name="chronicConditions" defaultValue={initial.chronicConditions} rows={2} className="input resize-none" placeholder="Ex: Diabetes tipo 2, hipertensão..." />
      </div>

      {msg && (
        <p className={`rounded-xl px-4 py-2 text-sm ${msg.type === "ok" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>{msg.text}</p>
      )}

      <button disabled={loading} className="btn-primary">
        {loading ? <><Loader2 className="animate-spin" size={16} /> A guardar...</> : <><Save size={16} /> Guardar perfil</>}
      </button>
    </form>
  );
}
