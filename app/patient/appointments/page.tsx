import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { PageHeader, Card, EmptyState } from "@/components/dashboard/ui";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function PatientAppointments() {
  const session = await requireRole(["PATIENT"]);
  if (!session?.user.patientId) redirect("/login");

  const now = new Date();
  const appointments = await prisma.appointment.findMany({
    where: { patientId: session.user.patientId },
    orderBy: { dateTime: "desc" },
    include: { doctor: { include: { user: true } } },
  });

  const upcoming = appointments.filter((a) => a.dateTime >= now && a.status !== "CANCELLED" && a.status !== "COMPLETED");
  const past = appointments.filter((a) => !(a.dateTime >= now && a.status !== "CANCELLED" && a.status !== "COMPLETED"));

  return (
    <div>
      <PageHeader title="As minhas consultas" subtitle="Histórico e próximas marcações" />

      <Card title="Próximas" className="mb-6">
        {upcoming.length === 0 ? (
          <EmptyState message="Não tem consultas agendadas." />
        ) : (
          <div className="space-y-2">
            {upcoming.map((a) => (
              <div key={a.id} className="flex items-center justify-between rounded-xl border border-gray-100 p-4">
                <div>
                  <p className="font-medium text-ink">Dr(a). {a.doctor.user.name}</p>
                  <p className="text-sm text-body">{a.doctor.specialty} · {formatDateTime(a.dateTime)}</p>
                  {a.reason && <p className="text-xs text-body">Motivo: {a.reason}</p>}
                </div>
                <StatusBadge kind="appointment" value={a.status} />
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card title="Anteriores">
        {past.length === 0 ? (
          <EmptyState message="Sem consultas anteriores." />
        ) : (
          <div className="space-y-2">
            {past.map((a) => (
              <div key={a.id} className="flex items-center justify-between rounded-xl border border-gray-100 p-4">
                <div>
                  <p className="font-medium text-ink">Dr(a). {a.doctor.user.name}</p>
                  <p className="text-sm text-body">{a.doctor.specialty} · {formatDateTime(a.dateTime)}</p>
                </div>
                <StatusBadge kind="appointment" value={a.status} />
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
