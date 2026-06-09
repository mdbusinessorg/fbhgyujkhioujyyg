"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { HeartPulse, Loader2, ArrowRight } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(e.currentTarget);
    const res = await signIn("credentials", {
      email: String(form.get("email")),
      password: String(form.get("password")),
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      setError("Email ou palavra-passe incorretos.");
      return;
    }
    const callback = params.get("callbackUrl");
    router.push(callback || "/go");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="label">Email</label>
        <input name="email" type="email" required className="input" placeholder="o.seu@email.pt" />
      </div>
      <div>
        <label className="label">Palavra-passe</label>
        <input name="password" type="password" required className="input" placeholder="••••••••" />
      </div>
      {error && (
        <p className="rounded-xl bg-red-50 px-4 py-2 text-sm text-red-600">{error}</p>
      )}
      <button type="submit" disabled={loading} className="btn-primary w-full">
        {loading ? <><Loader2 className="animate-spin" size={16} /> A entrar...</> : <>Entrar <ArrowRight size={16} /></>}
      </button>
    </form>
  );
}

export default function LoginPage() {
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
          <h1 className="font-display text-2xl font-bold text-ink">Bem-vindo de volta</h1>
          <p className="mt-1 text-sm text-body">Aceda à sua conta para continuar.</p>

          <div className="mt-6">
            <Suspense fallback={<div className="text-sm text-body">A carregar...</div>}>
              <LoginForm />
            </Suspense>
          </div>

          <p className="mt-6 text-center text-sm text-body">
            Ainda não tem conta?{" "}
            <Link href="/register" className="font-semibold text-primary hover:underline">
              Criar conta
            </Link>
          </p>
        </div>

        <div className="mt-6 rounded-2xl bg-white/60 p-4 text-center text-xs text-body backdrop-blur">
          <p className="font-semibold text-ink">Contas de demonstração</p>
          <p className="mt-1">admin@clinicabemestar.pt · medico@clinicabemestar.pt · paciente@clinicabemestar.pt</p>
          <p>Palavra-passe: <span className="font-mono">demo1234</span></p>
        </div>
      </div>
    </main>
  );
}
