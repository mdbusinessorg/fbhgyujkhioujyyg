import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { authorize, handleError, ApiError } from "@/lib/api";
import { doctorSchema } from "@/lib/validations";
import { audit } from "@/lib/audit";

export async function POST(req: NextRequest) {
  try {
    const session = await authorize(["ADMIN"]);
    const parsed = doctorSchema.safeParse(await req.json());
    if (!parsed.success) {
      throw new ApiError(parsed.error.errors[0]?.message ?? "Dados inválidos");
    }
    const data = parsed.data;
    const email = data.email.toLowerCase().trim();

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) throw new ApiError("Já existe uma conta com este email", 409);

    const crmExists = await prisma.doctor.findUnique({ where: { crm: data.crm } });
    if (crmExists) throw new ApiError("Já existe um médico com este CRM", 409);

    const passwordHash = await bcrypt.hash(data.password, 10);
    const user = await prisma.user.create({
      data: {
        name: data.name,
        email,
        phone: data.phone,
        passwordHash,
        role: "DOCTOR",
        doctor: {
          create: {
            specialty: data.specialty,
            crm: data.crm,
            bio: data.bio,
            availableDays: data.availableDays,
            availableHours: data.availableHours,
          },
        },
      },
      include: { doctor: true },
    });

    await audit({
      actorId: session.user.id,
      actorName: session.user.name,
      action: "Criou médico",
      targetEntity: "Doctor",
      targetId: user.doctor!.id,
      metadata: { name: data.name, specialty: data.specialty },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleError(err);
  }
}
