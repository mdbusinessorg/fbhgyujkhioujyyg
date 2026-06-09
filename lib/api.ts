import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { Role } from "@prisma/client";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

/**
 * Garante que o utilizador autenticado tem um dos papéis permitidos.
 * Lança ApiError (capturado pelo handler) caso contrário.
 */
export async function authorize(roles: Role[]) {
  const session = await getSession();
  if (!session?.user) throw new ApiError("Não autenticado", 401);
  if (!roles.includes(session.user.role))
    throw new ApiError("Sem permissão", 403);
  return session;
}

export function handleError(err: unknown) {
  if (err instanceof ApiError) {
    return NextResponse.json({ error: err.message }, { status: err.status });
  }
  console.error("[api] erro inesperado:", err);
  return NextResponse.json({ error: "Erro interno" }, { status: 500 });
}
