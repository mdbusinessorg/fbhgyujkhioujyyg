import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

type AuditInput = {
  actorId?: string | null;
  actorName?: string | null;
  action: string;
  targetEntity: string;
  targetId?: string | null;
  metadata?: Record<string, unknown> | string | null;
};

function getIp(): string | null {
  try {
    const h = headers();
    return (
      h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      h.get("x-real-ip") ||
      null
    );
  } catch {
    return null;
  }
}

/**
 * Regista uma ação de escrita no AuditLog. Nunca lança — auditoria
 * não deve quebrar a operação principal.
 */
export async function audit(input: AuditInput) {
  try {
    const metadata =
      typeof input.metadata === "string"
        ? input.metadata
        : input.metadata
          ? JSON.stringify(input.metadata)
          : null;

    await prisma.auditLog.create({
      data: {
        actorId: input.actorId ?? null,
        actorName: input.actorName ?? null,
        action: input.action,
        targetEntity: input.targetEntity,
        targetId: input.targetId ?? null,
        metadata,
        ipAddress: getIp(),
      },
    });
  } catch (err) {
    console.error("[audit] falha ao registar log:", err);
  }
}
