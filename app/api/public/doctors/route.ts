import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const doctors = await prisma.doctor.findMany({
    where: { user: { isActive: true } },
    include: { user: { select: { name: true } } },
    orderBy: { specialty: "asc" },
  });

  return NextResponse.json({
    doctors: doctors.map((d) => ({
      id: d.id,
      name: d.user.name,
      specialty: d.specialty,
    })),
  });
}
