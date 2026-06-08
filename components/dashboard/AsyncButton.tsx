"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function AsyncButton({
  url,
  method = "POST",
  body,
  children,
  className,
  confirm,
  onDone,
}: {
  url: string;
  method?: string;
  body?: Record<string, unknown>;
  children: React.ReactNode;
  className?: string;
  confirm?: string;
  onDone?: () => void;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function run() {
    if (confirm && !window.confirm(confirm)) return;
    setLoading(true);
    try {
      const res = await fetch(url, {
        method,
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        alert(d.error || "Ocorreu um erro.");
      } else {
        onDone?.();
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <button onClick={run} disabled={loading} className={cn(className)}>
      {loading ? <Loader2 className="animate-spin" size={14} /> : children}
    </button>
  );
}
