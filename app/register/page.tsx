"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { HeartPulse, Loader2, ArrowRight } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(e.currentTarget);
    const payload = Object.fromEntries(form.entries());

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao criar conta");

      await signIn("credentials", {
        email: String(payload.email),
        password: String(payload.password),
        redirect: false,
      });
      router.push("/patient/profile");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado");
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-hero-gradient px-4 py-12">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-6 flex items-center justify-center gap-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white">
            <HeartPulse size={20} />
          </span>
          <span className="font-display text-xl font-bold text-ink">
            Clínica <span className="text-primary">Bem Estar</span>
          </span>
        </Link>

        <div className="glass-card bg-white/85 p-8">
          <h1 className="font-display text-2xl font-bold text-ink">Criar conta de paciente</h1>
          <p className="mt-1 text-sm text-body">Comece a cuidar da sua saúde connosco.</p>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div>
              <label className="label">Nome completo</label>
              <input name="name" required className="input" placeholder="Ex: João Silva" />
            </div>
            <div>
              <label className="label">Email</label>
              <input name="email" type="email" required className="input" placeholder="joao@email.pt" />
            </div>
            <div>
              <label className="label">Telefone</label>
              <input name="phone" className="input" placeholder="+351 ..." />
            </div>
            <div>
              <label className="label">Palavra-passe</label>
              <input name="password" type="password" required minLength={6} className="input" placeholder="Mínimo 6 caracteres" />
            </div>
            {error && (
              <p className="rounded-xl bg-red-50 px-4 py-2 text-sm text-red-600">{error}</p>
            )}
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? <><Loader2 className="animate-spin" size={16} /> A criar...</> : <>Criar conta <ArrowRight size={16} /></>}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-body">
            Já tem conta?{" "}
            <Link href="/login" className="font-semibold text-primary hover:underline">
              Entrar
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
