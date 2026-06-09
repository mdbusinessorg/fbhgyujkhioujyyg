import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorize, handleError, ApiError } from "@/lib/api";
import { assertDoctorOwnsPatient } from "@/lib/doctor";
import { audit } from "@/lib/audit";
import { notify } from "@/lib/notifications";

export async function POST(req: NextRequest) {
  try {
    const session = await authorize(["DOCTOR"]);
    const doctorId = session.user.doctorId!;
    const { patientId, message } = await req.json();
    if (!message || String(message).trim().length < 2) {
      throw new ApiError("Mensagem demasiado curta");
    }
    await assertDoctorOwnsPatient(doctorId, patientId);

    const patient = await prisma.patient.findUnique({ where: { id: patientId } });
    if (!patient) throw new ApiError("Paciente não encontrado", 404);

    await notify({
      userId: patient.userId,
      type: "MENSAGEM",
      title: `Mensagem de Dr(a). ${session.user.name}`,
      message: String(message),
      link: "/patient",
    });

    await audit({
      actorId: session.user.id,
      actorName: session.user.name,
      action: "Enviou mensagem ao paciente",
      targetEntity: "Patient",
      targetId: patientId,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleError(err);
  }
}
