import { prisma } from "@/lib/prisma";
import { PageHeader, Card, EmptyState } from "@/components/dashboard/ui";
import { CreateDoctorForm } from "@/components/admin/CreateDoctorForm";
import { AsyncButton } from "@/components/dashboard/AsyncButton";
import { CheckCircle2, XCircle } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminDoctors() {
  const doctors = await prisma.doctor.findMany({
    include: {
      user: true,
      _count: { select: { appointments: true, consultations: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <PageHeader
        title="Médicos"
        subtitle={`${doctors.length} médicos na equipa`}
        action={<CreateDoctorForm />}
      />
      <Card>
        {doctors.length === 0 ? (
          <EmptyState message="Sem médicos registados." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="table-th">Nome</th>
                  <th className="table-th">Especialidade</th>
                  <th className="table-th">CRM</th>
                  <th className="table-th">Horário</th>
                  <th className="table-th">Consultas</th>
                  <th className="table-th">Estado</th>
                  <th className="table-th text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {doctors.map((d) => (
                  <tr key={d.id} className="border-b border-gray-50">
                    <td className="table-td font-medium">Dr(a). {d.user.name}</td>
                    <td className="table-td">{d.specialty}</td>
                    <td className="table-td text-body">{d.crm}</td>
                    <td className="table-td text-body">{d.availableDays || "—"} {d.availableHours || ""}</td>
                    <td className="table-td">{d._count.consultations} / {d._count.appointments}</td>
                    <td className="table-td">
                      {d.user.isActive ? (
                        <span className="badge bg-emerald-100 text-emerald-700">Ativo</span>
                      ) : (
                        <span className="badge bg-gray-100 text-gray-500">Inativo</span>
                      )}
                    </td>
                    <td className="table-td text-right">
                      <AsyncButton
                        url={`/api/admin/users/${d.userId}/toggle`}
                        className={`badge ${d.user.isActive ? "bg-red-50 text-red-600 hover:bg-red-100" : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"}`}
                        confirm={d.user.isActive ? "Desativar este médico?" : "Reativar este médico?"}
                      >
                        {d.user.isActive ? (<><XCircle size={14} /> Desativar</>) : (<><CheckCircle2 size={14} /> Reativar</>)}
                      </AsyncButton>
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
