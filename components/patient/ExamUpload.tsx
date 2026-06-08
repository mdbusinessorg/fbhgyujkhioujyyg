"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Upload } from "lucide-react";

export function ExamUpload({ examId }: { examId: string }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`/api/patient/exams/${examId}/upload`, {
        method: "POST",
        body: fd,
      });
      if (!res.ok) throw new Error((await res.json()).error || "Erro no upload");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,image/*"
        className="hidden"
        onChange={onChange}
      />
      <button
        onClick={() => inputRef.current?.click()}
        disabled={loading}
        className="badge bg-primary-50 text-primary hover:bg-primary-100"
      >
        {loading ? <Loader2 className="animate-spin" size={14} /> : <><Upload size={14} /> Carregar resultado</>}
      </button>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
