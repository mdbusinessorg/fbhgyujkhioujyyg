import { prisma } from "@/lib/prisma";
import { PageHeader, Card, EmptyState } from "@/components/dashboard/ui";
import { AsyncButton } from "@/components/dashboard/AsyncButton";
import { formatDate, age } from "@/lib/utils";
import { CheckCircle2, XCircle } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminPatients() {
  const patients = await prisma.patient.findMany({
    include: {
      user: true,
      _count: { select: { appointments: true } },
      payments: { where: { status: "OVERDUE" }, select: { id: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <PageHeader
        title="Pacientes"
        subtitle={`${patients.length} pacientes registados`}
      />
      <Card>
        {patients.length === 0 ? (
          <EmptyState message="Sem pacientes registados." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="table-th">Nome</th>
                  <th className="table-th">Email</th>
                  <th className="table-th">Idade</th>
                  <th className="table-th">Consultas</th>
                  <th className="table-th">Estado</th>
                  <th className="table-th">Registo</th>
                  <th className="table-th text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {patients.map((p) => {
                  const overdue = p.payments.length > 0;
                  return (
                    <tr key={p.id} className="border-b border-gray-50">
                      <td className="table-td font-medium">{p.user.name}</td>
                      <td className="table-td text-body">{p.user.email}</td>
                      <td className="table-td">{age(p.dob) ?? "—"}</td>
                      <td className="table-td">{p._count.appointments}</td>
                      <td className="table-td">
                        {!p.user.isActive ? (
                          <span className="badge bg-gray-100 text-gray-500">Inativo</span>
                        ) : overdue ? (
                          <span className="badge bg-red-100 text-red-600">Pagamento em atraso</span>
                        ) : p.onboarded ? (
                          <span className="badge bg-emerald-100 text-emerald-700">Ativo</span>
                        ) : (
                          <span className="badge bg-amber-100 text-amber-700">Perfil incompleto</span>
                        )}
                      </td>
                      <td className="table-td text-body">{formatDate(p.user.createdAt)}</td>
                      <td className="table-td text-right">
                        <AsyncButton
                          url={`/api/admin/users/${p.userId}/toggle`}
                          className={`badge ${p.user.isActive ? "bg-red-50 text-red-600 hover:bg-red-100" : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"}`}
                          confirm={p.user.isActive ? "Desativar este paciente?" : "Reativar este paciente?"}
                        >
                          {p.user.isActive ? (
                            <><XCircle size={14} /> Desativar</>
                          ) : (
                            <><CheckCircle2 size={14} /> Reativar</>
                          )}
                        </AsyncButton>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
