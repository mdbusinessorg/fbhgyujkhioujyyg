import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorize, handleError, ApiError } from "@/lib/api";
import { assertDoctorOwnsConsultation } from "@/lib/doctor";
import { examSchema } from "@/lib/validations";
import { audit } from "@/lib/audit";
import { notify } from "@/lib/notifications";

export async function POST(req: NextRequest) {
  try {
    const session = await authorize(["DOCTOR"]);
    const doctorId = session.user.doctorId!;
    const body = await req.json();
    const consultationId = String(body.consultationId || "");
    const consultation = await assertDoctorOwnsConsultation(doctorId, consultationId);

    const parsed = examSchema.safeParse(body);
    if (!parsed.success) {
      throw new ApiError(parsed.error.errors[0]?.message ?? "Dados inválidos");
    }
    const d = parsed.data;

    const exam = await prisma.examRequest.create({
      data: {
        consultationId,
        examName: d.examName,
        urgency: d.urgency,
        notes: d.notes,
      },
    });

    await audit({
      actorId: session.user.id,
      actorName: session.user.name,
      action: "Solicitou exame",
      targetEntity: "ExamRequest",
      targetId: exam.id,
      metadata: { examName: d.examName, urgency: d.urgency },
    });

    const patient = await prisma.patient.findUnique({ where: { id: consultation.patientId } });
    if (patient) {
      await notify({
        userId: patient.userId,
        type: "SISTEMA",
        title: "Novo exame solicitado",
        message: `Foi solicitado o exame: ${d.examName}. Pode carregar os resultados no seu portal.`,
        link: "/patient/exams",
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleError(err);
  }
}
