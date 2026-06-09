import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { PageHeader, Card, EmptyState } from "@/components/dashboard/ui";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { AsyncButton } from "@/components/dashboard/AsyncButton";
import { formatDateTime } from "@/lib/utils";
import { Check, FileText } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function DoctorSchedule() {
  const session = await requireRole(["DOCTOR"]);
  if (!session?.user.doctorId) redirect("/login");

  const appointments = await prisma.appointment.findMany({
    where: { doctorId: session.user.doctorId },
    orderBy: { dateTime: "desc" },
    include: { patient: { include: { user: true } }, consultation: { select: { id: true } } },
  });

  return (
    <div>
      <PageHeader title="Agenda" subtitle="As suas consultas" />
      <Card>
        {appointments.length === 0 ? (
          <EmptyState message="Sem consultas na sua agenda." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="table-th">Paciente</th>
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
                        <Link href={`/doctor/patients/${a.patientId}`} className="badge bg-primary-50 text-primary hover:bg-primary-100">
                          <FileText size={14} /> Ficha
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
