import { prisma } from "@/lib/prisma";
import { PageHeader, Card, StatCard } from "@/components/dashboard/ui";
import { formatCurrency } from "@/lib/utils";
import { Download, Users, CreditCard, CalendarDays, FileBarChart } from "lucide-react";

export const dynamic = "force-dynamic";

function startOfWeek() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay());
  return d;
}

export default async function AdminReports() {
  const [consultsWeek, paidWeek, newPatientsWeek, totalRevenue] = await Promise.all([
    prisma.consultation.count({ where: { createdAt: { gte: startOfWeek() } } }),
    prisma.payment.aggregate({ _sum: { amount: true }, where: { status: "PAID", paymentDate: { gte: startOfWeek() } } }),
    prisma.patient.count({ where: { createdAt: { gte: startOfWeek() } } }),
    prisma.payment.aggregate({ _sum: { amount: true }, where: { status: "PAID" } }),
  ]);

  const reports = [
    { type: "patients", title: "Lista de Pacientes", desc: "Todos os pacientes registados com dados de contacto.", icon: Users },
    { type: "payments", title: "Pagamentos & Receita", desc: "Histórico completo de pagamentos e estados.", icon: CreditCard },
    { type: "consultations", title: "Consultas", desc: "Registo de todas as consultas realizadas.", icon: CalendarDays },
  ];

  return (
    <div>
      <PageHeader title="Relatórios" subtitle="Resumo semanal e exportação de dados" />

      <Card title="Resumo da semana" className="mb-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Consultas (semana)" value={consultsWeek} icon={CalendarDays} />
          <StatCard label="Receita (semana)" value={formatCurrency(Number(paidWeek._sum.amount ?? 0))} icon={CreditCard} tone="accent" />
          <StatCard label="Novos pacientes" value={newPatientsWeek} icon={Users} tone="primary" />
          <StatCard label="Receita total" value={formatCurrency(Number(totalRevenue._sum.amount ?? 0))} icon={FileBarChart} tone="accent" />
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {reports.map((r) => (
          <Card key={r.type}>
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-50 text-primary">
              <r.icon size={20} />
            </span>
            <h3 className="mt-4 font-display text-lg font-semibold text-ink">{r.title}</h3>
            <p className="mt-1 text-sm text-body">{r.desc}</p>
            <a href={`/api/admin/reports?type=${r.type}`} className="btn-primary mt-4 w-full">
              <Download size={16} /> Exportar CSV
            </a>
          </Card>
        ))}
      </div>
    </div>
  );
}
