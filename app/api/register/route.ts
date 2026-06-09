import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validations";
import { audit } from "@/lib/audit";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Dados inválidos" },
        { status: 400 },
      );
    }
    const { name, email, password, phone } = parsed.data;
    const normalizedEmail = email.toLowerCase().trim();

    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Já existe uma conta com este email." },
        { status: 409 },
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        name,
        email: normalizedEmail,
        phone,
        passwordHash,
        role: "PATIENT",
        patient: { create: {} },
      },
    });

    await audit({
      actorId: user.id,
      actorName: name,
      action: "Registo de novo paciente",
      targetEntity: "User",
      targetId: user.id,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[register] erro:", err);
    return NextResponse.json({ error: "Erro ao criar conta" }, { status: 500 });
  }
}
