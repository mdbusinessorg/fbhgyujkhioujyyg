import { MetricType } from "@prisma/client";

export function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

export function formatCurrency(value: number | string) {
  const n = typeof value === "string" ? Number(value) : value;
  return new Intl.NumberFormat("pt-AO", {
    style: "currency",
    currency: "AOA",
  }).format(n || 0);
}

export function formatDate(date: Date | string | null | undefined) {
  if (!date) return "—";
  return new Intl.DateTimeFormat("pt-PT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date));
}

export function formatDateTime(date: Date | string | null | undefined) {
  if (!date) return "—";
  return new Intl.DateTimeFormat("pt-PT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export function age(dob: Date | string | null | undefined) {
  if (!dob) return null;
  const d = new Date(dob);
  const diff = Date.now() - d.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
}

/**
 * Avalia se um valor de métrica de saúde é anormal segundo limiares clínicos.
 * Para PRESSAO usa o valor sistólico (value) e diastólico (valueSecondary).
 */
export function isAbnormalMetric(
  type: MetricType,
  value: number,
  valueSecondary?: number | null,
): { abnormal: boolean; reason?: string } {
  switch (type) {
    case MetricType.PRESSAO: {
      const sys = value;
      const dia = valueSecondary ?? 0;
      if (sys >= 140 || dia >= 90)
        return { abnormal: true, reason: "Pressão arterial elevada (≥140/90)" };
      if (sys < 90 || dia < 60)
        return { abnormal: true, reason: "Pressão arterial baixa (<90/60)" };
      return { abnormal: false };
    }
    case MetricType.GLICEMIA:
      if (value > 126)
        return { abnormal: true, reason: "Glicemia em jejum elevada (>126 mg/dL)" };
      if (value < 70)
        return { abnormal: true, reason: "Glicemia baixa (<70 mg/dL)" };
      return { abnormal: false };
    default:
      return { abnormal: false };
  }
}

export const METRIC_LABELS: Record<MetricType, string> = {
  PESO: "Peso",
  ALTURA: "Altura",
  PRESSAO: "Pressão Arterial",
  GLICEMIA: "Glicemia",
};

export const METRIC_UNITS: Record<MetricType, string> = {
  PESO: "kg",
  ALTURA: "cm",
  PRESSAO: "mmHg",
  GLICEMIA: "mg/dL",
};

export function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}
