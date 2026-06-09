import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorize, handleError, ApiError } from "@/lib/api";
import { audit } from "@/lib/audit";

export async function POST(req: NextRequest) {
  try {
    const session = await authorize(["DOCTOR"]);
    const doctorId = session.user.doctorId!;
    const { appointmentId, clinicalNotes } = await req.json();

    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { consultation: true },
    });
    if (!appointment || appointment.doctorId !== doctorId) {
      throw new ApiError("Marcação não atribuída a si", 403);
    }

    let consultation;
    if (appointment.consultation) {
      consultation = await prisma.consultation.update({
        where: { id: appointment.consultation.id },
        data: { clinicalNotes },
      });
    } else {
      consultation = await prisma.consultation.create({
        data: {
          appointmentId: appointment.id,
          patientId: appointment.patientId,
          doctorId,
          clinicalNotes,
        },
      });
      await prisma.appointment.update({
        where: { id: appointment.id },
        data: { status: "CONFIRMED" },
      });
    }

    await audit({
      actorId: session.user.id,
      actorName: session.user.name,
      action: "Registou notas clínicas",
      targetEntity: "Consultation",
      targetId: consultation.id,
    });

    return NextResponse.json({ ok: true, id: consultation.id });
  } catch (err) {
    return handleError(err);
  }
}
