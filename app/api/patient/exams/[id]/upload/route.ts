import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/prisma";
import { authorize, handleError, ApiError } from "@/lib/api";
import { audit } from "@/lib/audit";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await authorize(["PATIENT"]);
    const patientId = session.user.patientId;

    const exam = await prisma.examRequest.findUnique({
      where: { id: params.id },
      include: { consultation: true },
    });
    if (!exam) throw new ApiError("Exame não encontrado", 404);
    if (exam.consultation.patientId !== patientId) {
      throw new ApiError("Sem permissão", 403);
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) throw new ApiError("Ficheiro em falta");
    if (file.size > 8 * 1024 * 1024) throw new ApiError("Ficheiro demasiado grande (máx. 8MB)");

    const bytes = Buffer.from(await file.arrayBuffer());
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const fileName = `${Date.now()}-${safeName}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });
    await writeFile(path.join(uploadDir, fileName), bytes);
    const url = `/uploads/${fileName}`;

    await prisma.examRequest.update({
      where: { id: params.id },
      data: { resultFileUrl: url, status: "COMPLETED" },
    });

    await audit({
      actorId: session.user.id,
      actorName: session.user.name,
      action: "Carregou resultado de exame",
      targetEntity: "ExamRequest",
      targetId: exam.id,
    });

    return NextResponse.json({ ok: true, url });
  } catch (err) {
    return handleError(err);
  }
}
