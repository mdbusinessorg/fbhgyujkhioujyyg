import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorize, handleError, ApiError } from "@/lib/api";
import { patientProfileSchema } from "@/lib/validations";
import { audit } from "@/lib/audit";

export async function POST(req: NextRequest) {
  try {
    const session = await authorize(["PATIENT"]);
    const patientId = session.user.patientId;
    if (!patientId) throw new ApiError("Perfil de paciente não encontrado", 404);

    const parsed = patientProfileSchema.safeParse(await req.json());
    if (!parsed.success) {
      throw new ApiError(parsed.error.errors[0]?.message ?? "Dados inválidos");
    }
    const d = parsed.data;

    await prisma.patient.update({
      where: { id: patientId },
      data: {
        dob: d.dob ? new Date(d.dob) : null,
        gender: d.gender || null,
        address: d.address || null,
        bloodType: d.bloodType || null,
        allergies: d.allergies || null,
        chronicConditions: d.chronicConditions || null,
        emergencyContact: d.emergencyContact || null,
        onboarded: true,
      },
    });

    await audit({
      actorId: session.user.id,
      actorName: session.user.name,
      action: "Atualizou perfil de saúde",
      targetEntity: "Patient",
      targetId: patientId,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleError(err);
  }
}
