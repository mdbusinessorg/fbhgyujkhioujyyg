import {
  Users,
  Stethoscope,
  CalendarDays,
  CreditCard,
  AlertTriangle,
  TrendingUp,
  Clock,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PageHeader, StatCard, Card, EmptyState } from "@/components/dashboard/ui";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import Link from "next/link";

export const dynamic = "force-dynamic";

function startOf(period: "day" | "week" | "month") {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  if (period === "week") d.setDate(d.getDate() - d.getDay());
  if (period === "month") d.setDate(1);
  return d;
}

export default async function AdminHome() {
  const [
    consultToday,
    consultWeek,
    consultMonth,
    paidAgg,
    pendingAgg,
    overdueAgg,
    totalPatients,
    totalDoctors,
    pendingAppointments,
    recentAppointments,
    overduePayments,
    incompleteProfiles,
  ] = await Promise.all([
    prisma.consultation.count({ where: { createdAt: { gte: startOf("day") } } }),
    prisma.consultation.count({ where: { createdAt: { gte: startOf("week") } } }),
    prisma.consultation.count({ where: { createdAt: { gte: startOf("month") } } }),
    prisma.payment.aggregate({ _sum: { amount: true }, where: { status: "PAID" } }),
    prisma.payment.aggregate({ _sum: { amount: true }, where: { status: "PENDING" } }),
    prisma.payment.aggregate({ _sum: { amount: true }, where: { status: "OVERDUE" } }),
    prisma.patient.count(),
    prisma.doctor.count(),
    prisma.appointment.count({ where: { status: "PENDING" } }),
    prisma.appointment.findMany({
      take: 6,
      orderBy: { dateTime: "desc" },
      include: {
        patient: { include: { user: true } },
        doctor: { include: { user: true } },
      },
    }),
    prisma.payment.findMany({
      where: { status: "OVERDUE" },
      take: 5,
      include: { patient: { include: { user: true } } },
      orderBy: { dueDate: "asc" },
    }),
    prisma.patient.count({ where: { onboarded: false } }),
  ]);

  const paid = Number(paidAgg._sum.amount ?? 0);
  const pending = Number(pendingAgg._sum.amount ?? 0);
  const overdue = Number(overdueAgg._sum.amount ?? 0);

  return (
    <div>
      <PageHeader
        title="Visão Geral"
        subtitle="Painel de controlo da Clínica Bem Estar"
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Consultas hoje" value={consultToday} icon={CalendarDays} hint={`${consultWeek} esta semana · ${consultMonth} este mês`} />
        <StatCard label="Receita recebida" value={formatCurrency(paid)} icon={CreditCard} tone="accent" hint={`${formatCurrency(pending + overdue)} em aberto`} />
        <StatCard label="Pacientes" value={totalPatients} icon={Users} tone="primary" />
        <StatCard label="Médicos" value={totalDoctors} icon={Stethoscope} tone="primary" />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <StatCard label="Por receber (pendente)" value={formatCurrency(pending)} icon={Clock} tone="amber" />
        <StatCard label="Em atraso (>0)" value={formatCurrency(overdue)} icon={AlertTriangle} tone="red" />
        <StatCard label="Consultas pendentes" value={pendingAppointments} icon={TrendingUp} tone="amber" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card
          className="lg:col-span-2"
          title="Consultas recentes"
          action={<Link href="/admin/appointments" className="text-sm font-medium text-primary hover:underline">Ver todas</Link>}
        >
          {recentAppointments.length === 0 ? (
            <EmptyState message="Ainda não há consultas registadas." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="table-th">Paciente</th>
                    <th className="table-th">Médico</th>
                    <th className="table-th">Data</th>
                    <th className="table-th">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {recentAppointments.map((a) => (
                    <tr key={a.id} className="border-b border-gray-50">
                      <td className="table-td font-medium">{a.patient.user.name}</td>
                      <td className="table-td">{a.doctor.user.name}</td>
                      <td className="table-td">{formatDateTime(a.dateTime)}</td>
                      <td className="table-td"><StatusBadge kind="appointment" value={a.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card title="Alertas">
          <div className="space-y-3">
            <div className="flex items-start gap-3 rounded-xl bg-red-50 p-3">
              <AlertTriangle className="mt-0.5 text-red-500" size={18} />
              <div>
                <p className="text-sm font-semibold text-ink">{overduePayments.length} pagamentos em atraso</p>
                <p className="text-xs text-body">Total {formatCurrency(overdue)}</p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-xl bg-amber-50 p-3">
              <Clock className="mt-0.5 text-amber-500" size={18} />
              <div>
                <p className="text-sm font-semibold text-ink">{pendingAppointments} consultas por confirmar</p>
                <p className="text-xs text-body">Requerem atenção</p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-xl bg-primary-50 p-3">
              <Users className="mt-0.5 text-primary" size={18} />
              <div>
                <p className="text-sm font-semibold text-ink">{incompleteProfiles} perfis incompletos</p>
                <p className="text-xs text-body">Pacientes sem onboarding</p>
              </div>
            </div>

            {overduePayments.length > 0 && (
              <div className="mt-4 border-t border-gray-100 pt-3">
                <p className="mb-2 text-xs font-semibold uppercase text-body">Atrasos recentes</p>
                {overduePayments.map((p) => (
                  <div key={p.id} className="flex items-center justify-between py-1.5 text-sm">
                    <span className="text-ink">{p.patient.user.name}</span>
                    <span className="font-semibold text-red-500">{formatCurrency(Number(p.amount))}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
