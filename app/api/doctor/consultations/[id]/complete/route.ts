import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorize, handleError } from "@/lib/api";
import { assertDoctorOwnsConsultation } from "@/lib/doctor";
import { audit } from "@/lib/audit";
import { notify } from "@/lib/notifications";

export async function POST(
  _req: Request,
  { params }: { params: { id: string } },
) {
  try {
    const session = await authorize(["DOCTOR"]);
    const doctorId = session.user.doctorId!;
    await assertDoctorOwnsConsultation(doctorId, params.id);

    const consultation = await prisma.consultation.update({
      where: { id: params.id },
      data: { completedAt: new Date() },
      include: { appointment: true, patient: true },
    });

    await prisma.appointment.update({
      where: { id: consultation.appointmentId },
      data: { status: "COMPLETED" },
    });

    // criar pagamento pendente se ainda não existir
    const existingPayment = await prisma.payment.findUnique({
      where: { consultationId: consultation.id },
    });
    if (!existingPayment) {
      await prisma.payment.create({
        data: {
          patientId: consultation.patientId,
          consultationId: consultation.id,
          amount: 60,
          status: "PENDING",
          description: "Consulta médica",
          dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
        },
      });
    }

    await audit({
      actorId: session.user.id,
      actorName: session.user.name,
      action: "Concluiu consulta",
      targetEntity: "Consultation",
      targetId: consultation.id,
    });

    await notify({
      userId: consultation.patient.userId,
      type: "LEMBRETE_CONSULTA",
      title: "Consulta concluída",
      message: "A sua consulta foi concluída. Veja as receitas e exames no seu portal.",
      link: "/patient/prescriptions",
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleError(err);
  }
}
