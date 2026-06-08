import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { Card, EmptyState } from "@/components/dashboard/ui";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ClinicalWorkspace } from "@/components/doctor/ClinicalWorkspace";
import { MetricsChart } from "@/components/MetricsChart";
import { formatDate, formatDateTime, age } from "@/lib/utils";
import { ArrowLeft, Droplet, AlertCircle, Phone } from "lucide-react";
import Link from "next/link";
import { MetricType } from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function DoctorPatientRecord({
  params,
}: {
  params: { id: string };
}) {
  const session = await requireRole(["DOCTOR"]);
  if (!session?.user.doctorId) redirect("/login");
  const doctorId = session.user.doctorId;

  const owns = await prisma.appointment.count({
    where: { doctorId, patientId: params.id },
  });
  if (owns === 0) notFound();

  const patient = await prisma.patient.findUnique({
    where: { id: params.id },
    include: {
      user: true,
      appointments: { where: { doctorId }, orderBy: { dateTime: "desc" } },
      healthMetrics: { orderBy: { recordedAt: "asc" } },
      treatmentPlans: { orderBy: { createdAt: "desc" } },
      consultations: {
        where: { doctorId },
        orderBy: { createdAt: "desc" },
        include: { prescriptions: true, examRequests: true },
      },
    },
  });
  if (!patient) notFound();

  const apptOptions = patient.appointments
    .filter((a) => a.status !== "CANCELLED")
    .map((a) => ({
      id: a.id,
      label: `${formatDateTime(a.dateTime)}`,
      consultationId:
        patient.consultations.find((c) => c.appointmentId === a.id)?.id ?? null,
      completed: a.status === "COMPLETED",
    }));

  const weight = patient.healthMetrics
    .filter((m) => m.type === MetricType.PESO)
    .map((m) => ({ date: formatDate(m.recordedAt), value: m.value }));
  const pressure = patient.healthMetrics
    .filter((m) => m.type === MetricType.PRESSAO)
    .map((m) => ({ date: formatDate(m.recordedAt), value: m.value, secondary: m.valueSecondary }));

  return (
    <div>
      <Link href="/doctor/schedule" className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline">
        <ArrowLeft size={16} /> Voltar à agenda
      </Link>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Patient header */}
          <Card>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="font-display text-2xl font-bold text-ink">{patient.user.name}</h1>
                <p className="text-sm text-body">{patient.user.email}</p>
                <div className="mt-3 flex flex-wrap gap-2 text-sm">
                  <span className="badge bg-primary-50 text-primary">{age(patient.dob) ?? "?"} anos</span>
                  {patient.gender && <span className="badge bg-gray-100 text-gray-600">{patient.gender}</span>}
                  {patient.bloodType && <span className="badge bg-red-50 text-red-600"><Droplet size={12} /> {patient.bloodType}</span>}
                </div>
              </div>
              {patient.user.phone && (
                <div className="flex items-center gap-2 text-sm text-body">
                  <Phone size={16} /> {patient.user.phone}
                </div>
              )}
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {patient.allergies && (
                <div className="rounded-xl bg-amber-50 p-3">
                  <p className="flex items-center gap-1 text-xs font-semibold text-amber-700"><AlertCircle size={14} /> Alergias</p>
                  <p className="mt-1 text-sm text-ink">{patient.allergies}</p>
                </div>
              )}
              {patient.chronicConditions && (
                <div className="rounded-xl bg-red-50 p-3">
                  <p className="flex items-center gap-1 text-xs font-semibold text-red-700"><AlertCircle size={14} /> Condições crónicas</p>
                  <p className="mt-1 text-sm text-ink">{patient.chronicConditions}</p>
                </div>
              )}
            </div>
          </Card>

          {/* Metrics */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <Card title="Peso (kg)"><MetricsChart data={weight} label="Peso" /></Card>
            <Card title="Pressão arterial (mmHg)"><MetricsChart data={pressure} label="Sistólica" secondaryLabel="Diastólica" /></Card>
          </div>

          {/* History */}
          <Card title="Histórico de consultas">
            {patient.consultations.length === 0 ? (
              <EmptyState message="Sem consultas registadas." />
            ) : (
              <div className="space-y-4">
                {patient.consultations.map((c) => (
                  <div key={c.id} className="rounded-xl border border-gray-100 p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-ink">{formatDate(c.createdAt)}</p>
                      {c.completedAt ? (
                        <span className="badge bg-emerald-100 text-emerald-700">Concluída</span>
                      ) : (
                        <span className="badge bg-amber-100 text-amber-700">Em curso</span>
                      )}
                    </div>
                    {c.clinicalNotes && <p className="mt-2 text-sm text-body">{c.clinicalNotes}</p>}
                    {c.prescriptions.length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs font-semibold uppercase text-body">Receitas</p>
                        {c.prescriptions.map((p) => (
                          <p key={p.id} className="text-sm text-ink">💊 {p.medicationName} — {p.dosage}, {p.frequency} ({p.durationDays} dias)</p>
                        ))}
                      </div>
                    )}
                    {c.examRequests.length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs font-semibold uppercase text-body">Exames</p>
                        {c.examRequests.map((ex) => (
                          <div key={ex.id} className="flex items-center gap-2 text-sm text-ink">
                            🧪 {ex.examName} <StatusBadge kind="urgency" value={ex.urgency} /> <StatusBadge kind="exam" value={ex.status} />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Clinical workspace */}
        <div className="space-y-6">
          <ClinicalWorkspace patientId={patient.id} appointments={apptOptions} />

          {patient.treatmentPlans.length > 0 && (
            <Card title="Planos de tratamento">
              {patient.treatmentPlans.map((p) => (
                <div key={p.id} className="mb-3 rounded-xl border border-gray-100 p-3">
                  <p className="font-semibold text-ink">{p.title}</p>
                  {p.description && <p className="text-sm text-body">{p.description}</p>}
                  {p.goals.length > 0 && (
                    <ul className="mt-2 list-inside list-disc text-sm text-body">
                      {p.goals.map((g, i) => <li key={i}>{g}</li>)}
                    </ul>
                  )}
                </div>
              ))}
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
