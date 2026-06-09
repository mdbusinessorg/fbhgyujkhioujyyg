import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorize, handleError, ApiError } from "@/lib/api";
import { appointmentSchema } from "@/lib/validations";
import { audit } from "@/lib/audit";
import { notify } from "@/lib/notifications";

export async function POST(req: NextRequest) {
  try {
    const session = await authorize(["ADMIN"]);
    const parsed = appointmentSchema.safeParse(await req.json());
    if (!parsed.success) {
      throw new ApiError(parsed.error.errors[0]?.message ?? "Dados inválidos");
    }
    const { patientId, doctorId, dateTime, reason } = parsed.data;

    const appointment = await prisma.appointment.create({
      data: {
        patientId,
        doctorId,
        dateTime: new Date(dateTime),
        reason,
        status: "CONFIRMED",
        createdBy: session.user.id,
      },
      include: { patient: { include: { user: true } }, doctor: { include: { user: true } } },
    });

    await audit({
      actorId: session.user.id,
      actorName: session.user.name,
      action: "Criou consulta",
      targetEntity: "Appointment",
      targetId: appointment.id,
      metadata: { patientId, doctorId, dateTime },
    });

    await notify({
      userId: appointment.patient.userId,
      type: "LEMBRETE_CONSULTA",
      title: "Nova consulta agendada",
      message: `Consulta com Dr(a). ${appointment.doctor.user.name} em ${new Date(dateTime).toLocaleString("pt-PT")}.`,
      link: "/patient/appointments",
    });

    return NextResponse.json({ ok: true, id: appointment.id });
  } catch (err) {
    return handleError(err);
  }
}
