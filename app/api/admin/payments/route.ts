import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorize, handleError, ApiError } from "@/lib/api";
import { paymentSchema } from "@/lib/validations";
import { audit } from "@/lib/audit";
import { notify } from "@/lib/notifications";

export async function POST(req: NextRequest) {
  try {
    const session = await authorize(["ADMIN"]);
    const parsed = paymentSchema.safeParse(await req.json());
    if (!parsed.success) {
      throw new ApiError(parsed.error.errors[0]?.message ?? "Dados inválidos");
    }
    const d = parsed.data;

    const payment = await prisma.payment.create({
      data: {
        patientId: d.patientId,
        consultationId: d.consultationId || null,
        amount: d.amount,
        status: d.status,
        description: d.description,
        dueDate: d.dueDate ? new Date(d.dueDate) : null,
        paymentDate: d.status === "PAID" ? new Date() : null,
      },
      include: { patient: true },
    });

    await audit({
      actorId: session.user.id,
      actorName: session.user.name,
      action: "Registou pagamento",
      targetEntity: "Payment",
      targetId: payment.id,
      metadata: { amount: d.amount, status: d.status },
    });

    if (d.status !== "PAID") {
      await notify({
        userId: payment.patient.userId,
        type: "PAGAMENTO_PENDENTE",
        title: "Novo pagamento registado",
        message: `Tem um pagamento de ${d.amount} Kz ${d.status === "OVERDUE" ? "em atraso" : "pendente"}.`,
        link: "/patient/payments",
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleError(err);
  }
}
