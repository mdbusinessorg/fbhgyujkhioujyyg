import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorize, handleError, ApiError } from "@/lib/api";
import { metricSchema } from "@/lib/validations";
import { isAbnormalMetric, METRIC_UNITS, METRIC_LABELS } from "@/lib/utils";
import { audit } from "@/lib/audit";
import { notify } from "@/lib/notifications";
import { MetricType } from "@prisma/client";

export async function POST(req: NextRequest) {
  try {
    const session = await authorize(["PATIENT"]);
    const patientId = session.user.patientId;
    if (!patientId) throw new ApiError("Perfil de paciente não encontrado", 404);

    const parsed = metricSchema.safeParse(await req.json());
    if (!parsed.success) {
      throw new ApiError(parsed.error.errors[0]?.message ?? "Dados inválidos");
    }
    const { type, value, valueSecondary } = parsed.data;
    const metricType = type as MetricType;

    const { abnormal, reason } = isAbnormalMetric(
      metricType,
      value,
      valueSecondary ?? null,
    );

    await prisma.healthMetric.create({
      data: {
        patientId,
        type: metricType,
        value,
        valueSecondary: valueSecondary ?? null,
        unit: METRIC_UNITS[metricType],
        abnormal,
      },
    });

    await audit({
      actorId: session.user.id,
      actorName: session.user.name,
      action: `Registou métrica (${METRIC_LABELS[metricType]})`,
      targetEntity: "HealthMetric",
      targetId: patientId,
      metadata: { value, valueSecondary, abnormal },
    });

    // notificar médicos atribuídos se valor anormal
    if (abnormal) {
      const doctors = await prisma.appointment.findMany({
        where: { patientId },
        distinct: ["doctorId"],
        include: { doctor: true },
      });
      const patient = await prisma.patient.findUnique({
        where: { id: patientId },
        include: { user: true },
      });
      for (const a of doctors) {
        await notify({
          userId: a.doctor.userId,
          type: "VALOR_ANORMAL",
          title: "Valor anormal registado",
          message: `${patient?.user.name}: ${reason}`,
          link: `/doctor/patients/${patientId}`,
        });
      }
    }

    return NextResponse.json({ ok: true, abnormal, reason });
  } catch (err) {
    return handleError(err);
  }
}
