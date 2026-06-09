import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorize, handleError, ApiError } from "@/lib/api";
import { audit } from "@/lib/audit";
import { notify } from "@/lib/notifications";
import { AppointmentStatus } from "@prisma/client";

const valid: AppointmentStatus[] = ["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"];

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await authorize(["ADMIN", "DOCTOR"]);
    const body = await req.json();
    const status = body.status as AppointmentStatus;
    if (!valid.includes(status)) throw new ApiError("Estado inválido");

    const appointment = await prisma.appointment.findUnique({
      where: { id: params.id },
      include: { patient: { include: { user: true } }, consultation: true },
    });
    if (!appointment) throw new ApiError("Consulta não encontrada", 404);

    const updated = await prisma.appointment.update({
      where: { id: params.id },
      data: { status },
    });

    // ao concluir, gerar consulta + pagamento pendente (se ainda não existir)
    if (status === "COMPLETED" && !appointment.consultation) {
      const consultation = await prisma.consultation.create({
        data: {
          appointmentId: appointment.id,
          patientId: appointment.patientId,
          doctorId: appointment.doctorId,
          completedAt: new Date(),
        },
      });
      await prisma.payment.create({
        data: {
          patientId: appointment.patientId,
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
      action: `Atualizou estado da consulta para ${status}`,
      targetEntity: "Appointment",
      targetId: appointment.id,
    });

    await notify({
      userId: appointment.patient.userId,
      type: "LEMBRETE_CONSULTA",
      title: "Estado da consulta atualizado",
      message: `A sua consulta passou para o estado: ${status}.`,
      link: "/patient/appointments",
    });

    return NextResponse.json({ ok: true, status: updated.status });
  } catch (err) {
    return handleError(err);
  }
}
