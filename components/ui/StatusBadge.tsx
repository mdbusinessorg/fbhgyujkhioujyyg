import { cn } from "@/lib/utils";

const appointment: Record<string, { label: string; cls: string }> = {
  PENDING: { label: "Pendente", cls: "bg-amber-100 text-amber-700" },
  CONFIRMED: { label: "Confirmada", cls: "bg-blue-100 text-blue-700" },
  COMPLETED: { label: "Concluída", cls: "bg-emerald-100 text-emerald-700" },
  CANCELLED: { label: "Cancelada", cls: "bg-red-100 text-red-600" },
};

const payment: Record<string, { label: string; cls: string }> = {
  PAID: { label: "Pago", cls: "bg-emerald-100 text-emerald-700" },
  PENDING: { label: "Pendente", cls: "bg-amber-100 text-amber-700" },
  OVERDUE: { label: "Em atraso", cls: "bg-red-100 text-red-600" },
};

const exam: Record<string, { label: string; cls: string }> = {
  REQUESTED: { label: "Solicitado", cls: "bg-amber-100 text-amber-700" },
  IN_PROGRESS: { label: "Em curso", cls: "bg-blue-100 text-blue-700" },
  COMPLETED: { label: "Concluído", cls: "bg-emerald-100 text-emerald-700" },
};

const urgency: Record<string, { label: string; cls: string }> = {
  ROTINA: { label: "Rotina", cls: "bg-gray-100 text-gray-600" },
  PRIORITARIO: { label: "Prioritário", cls: "bg-amber-100 text-amber-700" },
  URGENTE: { label: "Urgente", cls: "bg-red-100 text-red-600" },
};

const maps = { appointment, payment, exam, urgency };

export function StatusBadge({
  kind,
  value,
}: {
  kind: keyof typeof maps;
  value: string;
}) {
  const conf = maps[kind][value] ?? { label: value, cls: "bg-gray-100 text-gray-600" };
  return <span className={cn("badge", conf.cls)}>{conf.label}</span>;
}
