import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-body">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function StatCard({
  label,
  value,
  icon: Icon,
  tone = "primary",
  hint,
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  tone?: "primary" | "accent" | "amber" | "red";
  hint?: string;
}) {
  const tones = {
    primary: "bg-primary-50 text-primary",
    accent: "bg-accent/10 text-accent",
    amber: "bg-amber-50 text-amber-600",
    red: "bg-red-50 text-red-500",
  };
  return (
    <div className="stat-card flex items-start justify-between">
      <div>
        <p className="text-sm text-body">{label}</p>
        <p className="mt-1 font-display text-2xl font-bold text-ink">{value}</p>
        {hint && <p className="mt-1 text-xs text-body">{hint}</p>}
      </div>
      <span
        className={cn(
          "flex h-11 w-11 items-center justify-center rounded-xl",
          tones[tone],
        )}
      >
        <Icon size={20} />
      </span>
    </div>
  );
}

export function Card({
  children,
  className,
  title,
  action,
}: {
  children: React.ReactNode;
  className?: string;
  title?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className={cn("rounded-2xl bg-white p-5 shadow-soft", className)}>
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between">
          {title && (
            <h3 className="font-display text-lg font-semibold text-ink">
              {title}
            </h3>
          )}
          {action}
        </div>
      )}
      {children}
    </div>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-gray-200 bg-white/50 py-12 text-center text-sm text-body">
      {message}
    </div>
  );
}
