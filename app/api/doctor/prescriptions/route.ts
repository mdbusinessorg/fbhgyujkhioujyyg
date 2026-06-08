import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorize, handleError, ApiError } from "@/lib/api";
import { assertDoctorOwnsConsultation } from "@/lib/doctor";
import { prescriptionSchema } from "@/lib/validations";
import { audit } from "@/lib/audit";
import { notify } from "@/lib/notifications";

export async function POST(req: NextRequest) {
  try {
    const session = await authorize(["DOCTOR"]);
    const doctorId = session.user.doctorId!;
    const body = await req.json();
    const consultationId = String(body.consultationId || "");
    const consultation = await assertDoctorOwnsConsultation(doctorId, consultationId);

    const parsed = prescriptionSchema.safeParse(body);
    if (!parsed.success) {
      throw new ApiError(parsed.error.errors[0]?.message ?? "Dados inválidos");
    }
    const d = parsed.data;

    const prescription = await prisma.prescription.create({
      data: {
        consultationId,
        medicationName: d.medicationName,
        dosage: d.dosage,
        frequency: d.frequency,
        durationDays: d.durationDays,
        instructions: d.instructions,
      },
    });

    await audit({
      actorId: session.user.id,
      actorName: session.user.name,
      action: "Prescreveu medicação",
      targetEntity: "Prescription",
      targetId: prescription.id,
      metadata: { medicationName: d.medicationName },
    });

    const patient = await prisma.patient.findUnique({ where: { id: consultation.patientId } });
    if (patient) {
      await notify({
        userId: patient.userId,
        type: "RENOVACAO_RECEITA",
        title: "Nova receita",
        message: `Foi-lhe prescrito ${d.medicationName} (${d.dosage}).`,
        link: "/patient/prescriptions",
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleError(err);
  }
}
