import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorize, handleError, ApiError } from "@/lib/api";
import { assertDoctorOwnsPatient } from "@/lib/doctor";
import { audit } from "@/lib/audit";
import { notify } from "@/lib/notifications";

export async function POST(req: NextRequest) {
  try {
    const session = await authorize(["DOCTOR", "ADMIN"]);
    const body = await req.json();
    const { patientId, title, description, goals, endDate } = body;

    if (!patientId || !title) throw new ApiError("Dados em falta");

    if (session.user.role === "DOCTOR") {
      await assertDoctorOwnsPatient(session.user.doctorId!, patientId);
    }

    const goalsArr: string[] = Array.isArray(goals)
      ? goals.filter((g: unknown) => typeof g === "string" && g.trim())
      : String(goals || "")
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean);

    const plan = await prisma.treatmentPlan.create({
      data: {
        patientId,
        doctorId: session.user.doctorId ?? null,
        title,
        description,
        goals: goalsArr,
        endDate: endDate ? new Date(endDate) : null,
      },
      include: { patient: true },
    });

    await audit({
      actorId: session.user.id,
      actorName: session.user.name,
      action: "Criou plano de tratamento",
      targetEntity: "TreatmentPlan",
      targetId: plan.id,
    });

    await notify({
      userId: plan.patient.userId,
      type: "SISTEMA",
      title: "Novo plano de tratamento",
      message: `Foi definido um plano: ${title}.`,
      link: "/patient/plan",
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleError(err);
  }
}
