import { prisma } from "@/lib/prisma";
import { PageHeader, Card, EmptyState } from "@/components/dashboard/ui";
import { CreateAppointmentForm } from "@/components/admin/CreateAppointmentForm";
import { AsyncButton } from "@/components/dashboard/AsyncButton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatDateTime } from "@/lib/utils";
import { Check, X, CheckCheck } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminAppointments() {
  const [appointments, patients, doctors] = await Promise.all([
    prisma.appointment.findMany({
      orderBy: { dateTime: "desc" },
      include: {
        patient: { include: { user: true } },
        doctor: { include: { user: true } },
        consultation: { select: { id: true } },
      },
    }),
    prisma.patient.findMany({ include: { user: true } }),
    prisma.doctor.findMany({ include: { user: true } }),
  ]);

  const patientOpts = patients.map((p) => ({ id: p.id, name: p.user.name, extra: p.user.email }));
  const doctorOpts = doctors.map((d) => ({ id: d.id, name: `Dr(a). ${d.user.name}`, extra: d.specialty }));

  return (
    <div>
      <PageHeader
        title="Consultas"
        subtitle={`${appointments.length} consultas no total`}
        action={<CreateAppointmentForm patients={patientOpts} doctors={doctorOpts} />}
      />
      <Card>
        {appointments.length === 0 ? (
          <EmptyState message="Sem consultas registadas." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="table-th">Paciente</th>
                  <th className="table-th">Médico</th>
                  <th className="table-th">Data</th>
                  <th className="table-th">Motivo</th>
                  <th className="table-th">Estado</th>
                  <th className="table-th text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((a) => (
                  <tr key={a.id} className="border-b border-gray-50">
                    <td className="table-td font-medium">{a.patient.user.name}</td>
                    <td className="table-td">Dr(a). {a.doctor.user.name}</td>
                    <td className="table-td text-body">{formatDateTime(a.dateTime)}</td>
                    <td className="table-td text-body">{a.reason || "—"}</td>
                    <td className="table-td"><StatusBadge kind="appointment" value={a.status} /></td>
                    <td className="table-td">
                      <div className="flex justify-end gap-1">
                        {a.status === "PENDING" && (
                          <AsyncButton url={`/api/admin/appointments/${a.id}`} method="PATCH" body={{ status: "CONFIRMED" }} className="badge bg-blue-50 text-blue-600 hover:bg-blue-100">
                            <Check size={14} /> Confirmar
                          </AsyncButton>
                        )}
                        {(a.status === "PENDING" || a.status === "CONFIRMED") && (
                          <>
                            <AsyncButton url={`/api/admin/appointments/${a.id}`} method="PATCH" body={{ status: "COMPLETED" }} className="badge bg-emerald-50 text-emerald-700 hover:bg-emerald-100">
                              <CheckCheck size={14} /> Concluir
                            </AsyncButton>
                            <AsyncButton url={`/api/admin/appointments/${a.id}`} method="PATCH" body={{ status: "CANCELLED" }} confirm="Cancelar esta consulta?" className="badge bg-red-50 text-red-600 hover:bg-red-100">
                              <X size={14} /> Cancelar
                            </AsyncButton>
                          </>
                        )}
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
