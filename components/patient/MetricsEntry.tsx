"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";

export function MetricsEntry() {
  const router = useRouter();
  const [type, setType] = useState("PESO");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    const form = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/patient/metrics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(form.entries())),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro");
      setMsg({
        type: data.abnormal ? "err" : "ok",
        text: data.abnormal ? `⚠️ ${data.reason} — o seu médico foi notificado.` : "Registo guardado.",
      });
      (e.target as HTMLFormElement).reset();
      router.refresh();
    } catch (err) {
      setMsg({ type: "err", text: err instanceof Error ? err.message : "Erro" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div>
        <label className="label">Tipo de métrica</label>
        <select name="type" value={type} onChange={(e) => setType(e.target.value)} className="input">
          <option value="PESO">Peso (kg)</option>
          <option value="ALTURA">Altura (cm)</option>
          <option value="PRESSAO">Pressão arterial (mmHg)</option>
          <option value="GLICEMIA">Glicemia (mg/dL)</option>
        </select>
      </div>

      {type === "PRESSAO" ? (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Sistólica</label>
            <input name="value" type="number" required className="input" placeholder="120" />
          </div>
          <div>
            <label className="label">Diastólica</label>
            <input name="valueSecondary" type="number" required className="input" placeholder="80" />
          </div>
        </div>
      ) : (
        <div>
          <label className="label">Valor</label>
          <input name="value" type="number" step="0.1" required className="input" placeholder="Insira o valor" />
        </div>
      )}

      {msg && (
        <p className={`rounded-xl px-4 py-2 text-sm ${msg.type === "ok" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>{msg.text}</p>
      )}

      <button disabled={loading} className="btn-primary w-full">
        {loading ? <Loader2 className="animate-spin" size={16} /> : <><Plus size={16} /> Registar métrica</>}
      </button>
    </form>
  );
}
