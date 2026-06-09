import { prisma } from "@/lib/prisma";
import { PageHeader, Card, EmptyState, StatCard } from "@/components/dashboard/ui";
import { CreatePaymentForm } from "@/components/admin/CreatePaymentForm";
import { AsyncButton } from "@/components/dashboard/AsyncButton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { CreditCard, Clock, AlertTriangle, Check, FileText } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminPayments() {
  const [payments, patients, paid, pending, overdue] = await Promise.all([
    prisma.payment.findMany({
      orderBy: { createdAt: "desc" },
      include: { patient: { include: { user: true } } },
    }),
    prisma.patient.findMany({ include: { user: true } }),
    prisma.payment.aggregate({ _sum: { amount: true }, where: { status: "PAID" } }),
    prisma.payment.aggregate({ _sum: { amount: true }, where: { status: "PENDING" } }),
    prisma.payment.aggregate({ _sum: { amount: true }, where: { status: "OVERDUE" } }),
  ]);

  const patientOpts = patients.map((p) => ({ id: p.id, name: p.user.name }));

  return (
    <div>
      <PageHeader
        title="Pagamentos"
        subtitle="Controlo financeiro e faturação"
        action={<CreatePaymentForm patients={patientOpts} />}
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Recebido" value={formatCurrency(Number(paid._sum.amount ?? 0))} icon={CreditCard} tone="accent" />
        <StatCard label="Pendente" value={formatCurrency(Number(pending._sum.amount ?? 0))} icon={Clock} tone="amber" />
        <StatCard label="Em atraso" value={formatCurrency(Number(overdue._sum.amount ?? 0))} icon={AlertTriangle} tone="red" />
      </div>

      <Card>
        {payments.length === 0 ? (
          <EmptyState message="Sem pagamentos registados." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="table-th">Paciente</th>
                  <th className="table-th">Descrição</th>
                  <th className="table-th">Valor</th>
                  <th className="table-th">Limite</th>
                  <th className="table-th">Estado</th>
                  <th className="table-th text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id} className="border-b border-gray-50">
                    <td className="table-td font-medium">{p.patient.user.name}</td>
                    <td className="table-td text-body">{p.description || "—"}</td>
                    <td className="table-td font-semibold">{formatCurrency(Number(p.amount))}</td>
                    <td className="table-td text-body">{formatDate(p.dueDate)}</td>
                    <td className="table-td"><StatusBadge kind="payment" value={p.status} /></td>
                    <td className="table-td">
                      <div className="flex justify-end gap-1">
                        {p.status !== "PAID" && (
                          <AsyncButton url={`/api/admin/payments/${p.id}`} method="PATCH" body={{ status: "PAID" }} className="badge bg-emerald-50 text-emerald-700 hover:bg-emerald-100">
                            <Check size={14} /> Marcar pago
                          </AsyncButton>
                        )}
                        <Link href={`/api/invoices/${p.id}`} target="_blank" className="badge bg-primary-50 text-primary hover:bg-primary-100">
                          <FileText size={14} /> Fatura
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
