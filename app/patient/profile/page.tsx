import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { PageHeader, Card } from "@/components/dashboard/ui";
import { ProfileForm } from "@/components/patient/ProfileForm";
import { MetricsEntry } from "@/components/patient/MetricsEntry";
import { MetricsChart } from "@/components/MetricsChart";
import { formatDate } from "@/lib/utils";
import { MetricType } from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function PatientProfile() {
  const session = await requireRole(["PATIENT"]);
  if (!session?.user.patientId) redirect("/login");

  const patient = await prisma.patient.findUnique({
    where: { id: session.user.patientId },
    include: { healthMetrics: { orderBy: { recordedAt: "asc" } } },
  });
  if (!patient) redirect("/login");

  const series = (t: MetricType) =>
    patient.healthMetrics
      .filter((m) => m.type === t)
      .map((m) => ({ date: formatDate(m.recordedAt), value: m.value, secondary: m.valueSecondary }));

  return (
    <div>
      <PageHeader title="Perfil & Métricas" subtitle="Mantenha os seus dados de saúde atualizados" />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2" title="Dados pessoais e clínicos">
          <ProfileForm
            initial={{
              dob: patient.dob ? new Date(patient.dob).toISOString().slice(0, 10) : "",
              gender: patient.gender ?? "",
              address: patient.address ?? "",
              bloodType: patient.bloodType ?? "",
              allergies: patient.allergies ?? "",
              chronicConditions: patient.chronicConditions ?? "",
              emergencyContact: patient.emergencyContact ?? "",
            }}
          />
        </Card>

        <Card title="Registar métrica">
          <MetricsEntry />
        </Card>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
        <Card title="Evolução do peso (kg)"><MetricsChart data={series(MetricType.PESO)} label="Peso" /></Card>
        <Card title="Pressão arterial (mmHg)"><MetricsChart data={series(MetricType.PRESSAO)} label="Sistólica" secondaryLabel="Diastólica" /></Card>
        <Card title="Glicemia (mg/dL)"><MetricsChart data={series(MetricType.GLICEMIA)} label="Glicemia" color="#00C48C" /></Card>
        <Card title="Altura (cm)"><MetricsChart data={series(MetricType.ALTURA)} label="Altura" color="#7DB8F6" /></Card>
      </div>
    </div>
  );
}
