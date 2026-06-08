import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { PageHeader, Card, EmptyState } from "@/components/dashboard/ui";
import { formatDate } from "@/lib/utils";
import { Target, CheckCircle2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function PatientPlan() {
  const session = await requireRole(["PATIENT"]);
  if (!session?.user.patientId) redirect("/login");

  const plans = await prisma.treatmentPlan.findMany({
    where: { patientId: session.user.patientId },
    orderBy: { createdAt: "desc" },
    include: { doctor: { include: { user: true } } },
  });

  return (
    <div>
      <PageHeader title="Plano de Tratamento" subtitle="O seu percurso de saúde personalizado" />
      {plans.length === 0 ? (
        <EmptyState message="Ainda não tem um plano de tratamento definido." />
      ) : (
        <div className="space-y-6">
          {plans.map((plan) => (
            <Card key={plan.id}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10 text-accent">
                    <Target size={20} />
                  </span>
                  <div>
                    <p className="font-display text-xl font-semibold text-ink">{plan.title}</p>
                    <p className="text-sm text-body">
                      {formatDate(plan.startDate)}{plan.endDate ? ` – ${formatDate(plan.endDate)}` : ""}
                      {plan.doctor ? ` · Dr(a). ${plan.doctor.user.name}` : ""}
                    </p>
                  </div>
                </div>
                {plan.active && <span className="badge bg-emerald-100 text-emerald-700">Ativo</span>}
              </div>

              {plan.description && <p className="mt-4 text-body">{plan.description}</p>}

              {plan.goals.length > 0 && (
                <div className="mt-4">
                  <p className="mb-2 text-sm font-semibold text-ink">Objetivos</p>
                  <ul className="space-y-2">
                    {plan.goals.map((g, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-body">
                        <CheckCircle2 size={16} className="text-accent" /> {g}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
