import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { PageHeader, Card, EmptyState } from "@/components/dashboard/ui";
import { formatDate } from "@/lib/utils";
import { Pill, Clock } from "lucide-react";

export const dynamic = "force-dynamic";

function daysRemaining(startDate: Date, durationDays: number) {
  const end = new Date(startDate);
  end.setDate(end.getDate() + durationDays);
  const diff = Math.ceil((end.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  return diff;
}

export default async function PatientPrescriptions() {
  const session = await requireRole(["PATIENT"]);
  if (!session?.user.patientId) redirect("/login");

  const prescriptions = await prisma.prescription.findMany({
    where: { consultation: { patientId: session.user.patientId } },
    orderBy: { startDate: "desc" },
    include: { consultation: { include: { doctor: { include: { user: true } } } } },
  });

  return (
    <div>
      <PageHeader title="Receitas" subtitle="As suas prescrições médicas" />
      {prescriptions.length === 0 ? (
        <EmptyState message="Ainda não tem receitas." />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {prescriptions.map((p) => {
            const remaining = daysRemaining(p.startDate, p.durationDays);
            const active = remaining > 0;
            return (
              <Card key={p.id}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10 text-accent">
                      <Pill size={20} />
                    </span>
                    <div>
                      <p className="font-display text-lg font-semibold text-ink">{p.medicationName}</p>
                      <p className="text-sm text-body">{p.dosage} · {p.frequency}</p>
                    </div>
                  </div>
                  {active ? (
                    <span className="badge bg-emerald-100 text-emerald-700">Ativa</span>
                  ) : (
                    <span className="badge bg-gray-100 text-gray-500">Concluída</span>
                  )}
                </div>

                {p.instructions && <p className="mt-3 rounded-xl bg-surface p-3 text-sm text-body">{p.instructions}</p>}

                <div className="mt-3 flex items-center justify-between text-sm">
                  <span className="text-body">Início: {formatDate(p.startDate)}</span>
                  <span className={`flex items-center gap-1 font-medium ${remaining <= 3 && active ? "text-amber-600" : "text-body"}`}>
                    <Clock size={14} />
                    {active ? `${remaining} dias restantes` : "Terminada"}
                  </span>
                </div>
                <p className="mt-2 text-xs text-body">Prescrito por Dr(a). {p.consultation.doctor.user.name}</p>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
