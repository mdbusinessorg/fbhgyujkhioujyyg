import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { publicBookingSchema } from "@/lib/validations";
import { audit } from "@/lib/audit";
import { notify } from "@/lib/notifications";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = publicBookingSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Dados inválidos" },
        { status: 400 },
      );
    }
    const { name, email, phone, doctorId, dateTime, reason } = parsed.data;

    const doctor = await prisma.doctor.findUnique({ where: { id: doctorId } });
    if (!doctor) {
      return NextResponse.json({ error: "Médico não encontrado" }, { status: 404 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // encontra ou cria utilizador paciente
    let user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: { patient: true },
    });

    let tempPassword: string | null = null;

    if (!user) {
      tempPassword = Math.random().toString(36).slice(-8);
      const passwordHash = await bcrypt.hash(tempPassword, 10);
      user = await prisma.user.create({
        data: {
          name,
          email: normalizedEmail,
          phone,
          passwordHash,
          role: "PATIENT",
          patient: { create: {} },
        },
        include: { patient: true },
      });
    }

    if (!user.patient) {
      await prisma.patient.create({ data: { userId: user.id } });
      user = await prisma.user.findUnique({
        where: { id: user.id },
        include: { patient: true },
      });
    }

    const patientId = user!.patient!.id;

    const appointment = await prisma.appointment.create({
      data: {
        patientId,
        doctorId,
        dateTime: new Date(dateTime),
        reason,
        status: "PENDING",
        createdBy: "public-booking",
      },
    });

    await audit({
      actorId: user!.id,
      actorName: name,
      action: "Pedido de agendamento público",
      targetEntity: "Appointment",
      targetId: appointment.id,
      metadata: { doctorId, dateTime },
    });

    await notify({
      userId: doctor.userId,
      type: "LEMBRETE_CONSULTA",
      title: "Novo pedido de consulta",
      message: `${name} solicitou uma consulta para ${new Date(dateTime).toLocaleString("pt-PT")}.`,
      link: "/doctor/schedule",
    });

    return NextResponse.json({
      ok: true,
      appointmentId: appointment.id,
      tempPassword,
    });
  } catch (err) {
    console.error("[booking] erro:", err);
    return NextResponse.json(
      { error: "Erro ao processar o pedido" },
      { status: 500 },
    );
  }
}
