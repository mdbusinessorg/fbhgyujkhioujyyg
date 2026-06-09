import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { PageHeader, StatCard, Card, EmptyState } from "@/components/dashboard/ui";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { CalendarDays, Pill, FlaskConical, CreditCard, AlertTriangle } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function PatientHome() {
  const session = await requireRole(["PATIENT"]);
  if (!session?.user.patientId) redirect("/login");
  const patientId = session.user.patientId;

  const patient = await prisma.patient.findUnique({ where: { id: patientId } });
  if (!patient) redirect("/login");

  const [upcoming, activeRx, pendingExams, balance, recentNotifs] = await Promise.all([
    prisma.appointment.findMany({
      where: { patientId, dateTime: { gte: new Date() }, status: { in: ["PENDING", "CONFIRMED"] } },
      orderBy: { dateTime: "asc" },
      take: 3,
      include: { doctor: { include: { user: true } } },
    }),
    prisma.prescription.count({ where: { consultation: { patientId } } }),
    prisma.examRequest.count({ where: { consultation: { patientId }, status: { not: "COMPLETED" } } }),
    prisma.payment.aggregate({ _sum: { amount: true }, where: { patientId, status: { in: ["PENDING", "OVERDUE"] } } }),
    prisma.notification.findMany({ where: { userId: session.user.id }, orderBy: { createdAt: "desc" }, take: 5 }),
  ]);

  return (
    <div>
      <PageHeader title={`Olá, ${session.user.name.split(" ")[0]}`} subtitle="O seu portal de saúde" />

      {!patient.onboarded && (
        <Link href="/patient/profile" className="mb-6 flex items-center gap-3 rounded-2xl bg-amber-50 p-4 text-amber-800 transition-colors hover:bg-amber-100">
          <AlertTriangle size={20} />
          <div>
            <p className="font-semibold">Complete o seu perfil de saúde</p>
            <p className="text-sm">Ajude-nos a cuidar melhor de si. Clique para preencher.</p>
          </div>
        </Link>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Próximas consultas" value={upcoming.length} icon={CalendarDays} />
        <StatCard label="Receitas ativas" value={activeRx} icon={Pill} tone="accent" />
        <StatCard label="Exames pendentes" value={pendingExams} icon={FlaskConical} tone="amber" />
        <StatCard label="Saldo em aberto" value={formatCurrency(Number(balance._sum.amount ?? 0))} icon={CreditCard} tone="red" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card title="Próximas consultas" action={<Link href="/patient/appointments" className="text-sm font-medium text-primary hover:underline">Ver todas</Link>}>
          {upcoming.length === 0 ? (
            <EmptyState message="Não tem consultas agendadas." />
          ) : (
            <div className="space-y-2">
              {upcoming.map((a) => (
                <div key={a.id} className="flex items-center justify-between rounded-xl border border-gray-100 p-3">
                  <div>
                    <p className="font-medium text-ink">Dr(a). {a.doctor.user.name}</p>
                    <p className="text-xs text-body">{formatDateTime(a.dateTime)}</p>
                  </div>
                  <StatusBadge kind="appointment" value={a.status} />
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card title="Notificações recentes">
          {recentNotifs.length === 0 ? (
            <EmptyState message="Sem notificações." />
          ) : (
            <div className="space-y-2">
              {recentNotifs.map((n) => (
                <div key={n.id} className="rounded-xl border border-gray-100 p-3">
                  <p className="text-sm font-semibold text-ink">{n.title}</p>
                  <p className="text-xs text-body">{n.message}</p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
