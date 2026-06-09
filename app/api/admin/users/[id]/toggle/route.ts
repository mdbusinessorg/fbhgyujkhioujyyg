import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorize, handleError } from "@/lib/api";
import { audit } from "@/lib/audit";

export async function POST(
  _req: Request,
  { params }: { params: { id: string } },
) {
  try {
    const session = await authorize(["ADMIN"]);
    const user = await prisma.user.findUnique({ where: { id: params.id } });
    if (!user) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

    const updated = await prisma.user.update({
      where: { id: params.id },
      data: { isActive: !user.isActive },
    });

    await audit({
      actorId: session.user.id,
      actorName: session.user.name,
      action: updated.isActive ? "Reativou utilizador" : "Desativou utilizador",
      targetEntity: "User",
      targetId: user.id,
      metadata: { email: user.email },
    });

    return NextResponse.json({ ok: true, isActive: updated.isActive });
  } catch (err) {
    return handleError(err);
  }
}
