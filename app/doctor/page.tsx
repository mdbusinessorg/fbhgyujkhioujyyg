import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { PageHeader, StatCard, Card, EmptyState } from "@/components/dashboard/ui";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatDateTime } from "@/lib/utils";
import { CalendarDays, Users, CheckCircle2, Clock } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function DoctorHome() {
  const session = await requireRole(["DOCTOR"]);
  if (!session?.user.doctorId) redirect("/login");
  const doctorId = session.user.doctorId;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [todayAppts, pendingCount, completedCount, patientCount, upcoming] =
    await Promise.all([
      prisma.appointment.count({
        where: { doctorId, dateTime: { gte: today, lt: tomorrow } },
      }),
      prisma.appointment.count({ where: { doctorId, status: "PENDING" } }),
      prisma.consultation.count({ where: { doctorId } }),
      prisma.appointment
        .findMany({ where: { doctorId }, select: { patientId: true }, distinct: ["patientId"] })
        .then((r) => r.length),
      prisma.appointment.findMany({
        where: { doctorId, dateTime: { gte: today }, status: { in: ["PENDING", "CONFIRMED"] } },
        orderBy: { dateTime: "asc" },
        take: 8,
        include: { patient: { include: { user: true } } },
      }),
    ]);

  return (
    <div>
      <PageHeader title="Visão Geral" subtitle={`Bom dia, Dr(a). ${session.user.name}`} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Consultas hoje" value={todayAppts} icon={CalendarDays} />
        <StatCard label="Por confirmar" value={pendingCount} icon={Clock} tone="amber" />
        <StatCard label="Consultas realizadas" value={completedCount} icon={CheckCircle2} tone="accent" />
        <StatCard label="Pacientes" value={patientCount} icon={Users} tone="primary" />
      </div>

      <Card
        className="mt-6"
        title="Próximas consultas"
        action={<Link href="/doctor/schedule" className="text-sm font-medium text-primary hover:underline">Ver agenda</Link>}
      >
        {upcoming.length === 0 ? (
          <EmptyState message="Sem consultas agendadas." />
        ) : (
          <div className="space-y-2">
            {upcoming.map((a) => (
              <Link
                key={a.id}
                href={`/doctor/patients/${a.patientId}`}
                className="flex items-center justify-between rounded-xl border border-gray-100 p-3 transition-colors hover:bg-primary-50"
              >
                <div>
                  <p className="font-medium text-ink">{a.patient.user.name}</p>
                  <p className="text-xs text-body">{formatDateTime(a.dateTime)} · {a.reason || "Consulta"}</p>
                </div>
                <StatusBadge kind="appointment" value={a.status} />
              </Link>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
