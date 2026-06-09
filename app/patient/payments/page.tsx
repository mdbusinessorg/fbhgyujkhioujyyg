import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { PageHeader, Card, EmptyState, StatCard } from "@/components/dashboard/ui";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { CreditCard, AlertTriangle, FileText } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function PatientPayments() {
  const session = await requireRole(["PATIENT"]);
  if (!session?.user.patientId) redirect("/login");
  const patientId = session.user.patientId;

  const [payments, paid, due] = await Promise.all([
    prisma.payment.findMany({ where: { patientId }, orderBy: { createdAt: "desc" } }),
    prisma.payment.aggregate({ _sum: { amount: true }, where: { patientId, status: "PAID" } }),
    prisma.payment.aggregate({ _sum: { amount: true }, where: { patientId, status: { in: ["PENDING", "OVERDUE"] } } }),
  ]);

  return (
    <div>
      <PageHeader title="Pagamentos" subtitle="Histórico e faturas" />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatCard label="Total pago" value={formatCurrency(Number(paid._sum.amount ?? 0))} icon={CreditCard} tone="accent" />
        <StatCard label="Em aberto" value={formatCurrency(Number(due._sum.amount ?? 0))} icon={AlertTriangle} tone="red" />
      </div>

      <Card>
        {payments.length === 0 ? (
          <EmptyState message="Sem pagamentos registados." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="table-th">Descrição</th>
                  <th className="table-th">Valor</th>
                  <th className="table-th">Data limite</th>
                  <th className="table-th">Estado</th>
                  <th className="table-th text-right">Fatura</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id} className="border-b border-gray-50">
                    <td className="table-td font-medium">{p.description || "Serviço clínico"}</td>
                    <td className="table-td font-semibold">{formatCurrency(Number(p.amount))}</td>
                    <td className="table-td text-body">{formatDate(p.dueDate)}</td>
                    <td className="table-td"><StatusBadge kind="payment" value={p.status} /></td>
                    <td className="table-td text-right">
                      <Link href={`/api/invoices/${p.id}`} target="_blank" className="badge bg-primary-50 text-primary hover:bg-primary-100">
                        <FileText size={14} /> Fatura
                      </Link>
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
