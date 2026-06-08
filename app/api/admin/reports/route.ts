import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorize, handleError } from "@/lib/api";
import { audit } from "@/lib/audit";

export const dynamic = "force-dynamic";

function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const escape = (v: unknown) => {
    const s = v === null || v === undefined ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [
    headers.join(","),
    ...rows.map((r) => headers.map((h) => escape(r[h])).join(",")),
  ];
  return "\uFEFF" + lines.join("\n");
}

export async function GET(req: NextRequest) {
  try {
    const session = await authorize(["ADMIN"]);
    const type = req.nextUrl.searchParams.get("type") || "patients";

    let rows: Record<string, unknown>[] = [];
    let filename = "relatorio.csv";

    if (type === "patients") {
      const patients = await prisma.patient.findMany({ include: { user: true } });
      rows = patients.map((p) => ({
        Nome: p.user.name,
        Email: p.user.email,
        Telefone: p.user.phone ?? "",
        Genero: p.gender ?? "",
        TipoSanguineo: p.bloodType ?? "",
        Ativo: p.user.isActive ? "Sim" : "Não",
        Registo: p.user.createdAt.toISOString().slice(0, 10),
      }));
      filename = "pacientes.csv";
    } else if (type === "payments") {
      const payments = await prisma.payment.findMany({
        include: { patient: { include: { user: true } } },
        orderBy: { createdAt: "desc" },
      });
      rows = payments.map((p) => ({
        Paciente: p.patient.user.name,
        Descricao: p.description ?? "",
        Valor: Number(p.amount).toFixed(2),
        Estado: p.status,
        DataLimite: p.dueDate?.toISOString().slice(0, 10) ?? "",
        Pago: p.paymentDate?.toISOString().slice(0, 10) ?? "",
      }));
      filename = "pagamentos.csv";
    } else if (type === "consultations") {
      const consults = await prisma.consultation.findMany({
        include: {
          patient: { include: { user: true } },
          doctor: { include: { user: true } },
        },
        orderBy: { createdAt: "desc" },
      });
      rows = consults.map((c) => ({
        Paciente: c.patient.user.name,
        Medico: c.doctor.user.name,
        Data: c.createdAt.toISOString().slice(0, 10),
        Concluida: c.completedAt ? "Sim" : "Não",
      }));
      filename = "consultas.csv";
    }

    await audit({
      actorId: session.user.id,
      actorName: session.user.name,
      action: `Exportou relatório (${type})`,
      targetEntity: "Report",
    });

    const csv = toCsv(rows);
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    return handleError(err);
  }
}
