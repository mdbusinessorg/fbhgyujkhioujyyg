import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorize, handleError, ApiError } from "@/lib/api";
import { audit } from "@/lib/audit";
import { notify } from "@/lib/notifications";
import { PaymentStatus } from "@prisma/client";

const valid: PaymentStatus[] = ["PAID", "PENDING", "OVERDUE"];

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await authorize(["ADMIN"]);
    const body = await req.json();
    const status = body.status as PaymentStatus;
    if (!valid.includes(status)) throw new ApiError("Estado inválido");

    const payment = await prisma.payment.findUnique({
      where: { id: params.id },
      include: { patient: true },
    });
    if (!payment) throw new ApiError("Pagamento não encontrado", 404);

    await prisma.payment.update({
      where: { id: params.id },
      data: {
        status,
        paymentDate: status === "PAID" ? new Date() : payment.paymentDate,
        overdueFlagged: status === "OVERDUE" ? true : payment.overdueFlagged,
      },
    });

    await audit({
      actorId: session.user.id,
      actorName: session.user.name,
      action: `Atualizou pagamento para ${status}`,
      targetEntity: "Payment",
      targetId: payment.id,
    });

    if (status === "PAID") {
      await notify({
        userId: payment.patient.userId,
        type: "PAGAMENTO_PENDENTE",
        title: "Pagamento confirmado",
        message: `O seu pagamento de ${Number(payment.amount)} Kz foi registado. Obrigado!`,
        link: "/patient/payments",
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleError(err);
  }
}
