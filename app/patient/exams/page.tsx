import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { PageHeader, Card, EmptyState } from "@/components/dashboard/ui";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ExamUpload } from "@/components/patient/ExamUpload";
import { formatDate } from "@/lib/utils";
import { FlaskConical, FileText } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function PatientExams() {
  const session = await requireRole(["PATIENT"]);
  if (!session?.user.patientId) redirect("/login");

  const exams = await prisma.examRequest.findMany({
    where: { consultation: { patientId: session.user.patientId } },
    orderBy: { createdAt: "desc" },
    include: { consultation: { include: { doctor: { include: { user: true } } } } },
  });

  return (
    <div>
      <PageHeader title="Exames" subtitle="Exames solicitados e resultados" />
      {exams.length === 0 ? (
        <EmptyState message="Não tem exames solicitados." />
      ) : (
        <div className="space-y-4">
          {exams.map((ex) => (
            <Card key={ex.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-50 text-primary">
                    <FlaskConical size={20} />
                  </span>
                  <div>
                    <p className="font-display text-lg font-semibold text-ink">{ex.examName}</p>
                    <p className="text-sm text-body">Solicitado em {formatDate(ex.createdAt)} por Dr(a). {ex.consultation.doctor.user.name}</p>
                    {ex.notes && <p className="mt-1 text-sm text-body">{ex.notes}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge kind="urgency" value={ex.urgency} />
                  <StatusBadge kind="exam" value={ex.status} />
                </div>
              </div>

              <div className="mt-4 flex items-center gap-3 border-t border-gray-100 pt-3">
                {ex.resultFileUrl ? (
                  <a href={ex.resultFileUrl} target="_blank" className="badge bg-emerald-50 text-emerald-700 hover:bg-emerald-100">
                    <FileText size={14} /> Ver resultado
                  </a>
                ) : (
                  <span className="text-sm text-body">Sem resultado carregado.</span>
                )}
                <ExamUpload examId={ex.id} />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
