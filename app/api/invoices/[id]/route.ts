import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { formatCurrency, formatDate } from "@/lib/utils";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const payment = await prisma.payment.findUnique({
    where: { id: params.id },
    include: { patient: { include: { user: true } } },
  });
  if (!payment) {
    return NextResponse.json({ error: "Fatura não encontrada" }, { status: 404 });
  }

  // paciente só acede às próprias faturas
  if (
    session.user.role === "PATIENT" &&
    session.user.patientId !== payment.patientId
  ) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const statusLabel =
    payment.status === "PAID"
      ? "PAGO"
      : payment.status === "OVERDUE"
        ? "EM ATRASO"
        : "PENDENTE";

  const html = `<!DOCTYPE html>
<html lang="pt"><head><meta charset="utf-8"><title>Fatura ${payment.id.slice(-6).toUpperCase()}</title>
<style>
  *{font-family:Arial,Helvetica,sans-serif;box-sizing:border-box}
  body{margin:0;background:#f0f8ff;padding:40px;color:#1a1a2e}
  .doc{max-width:680px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 8px 32px rgba(10,116,218,.12)}
  .head{background:linear-gradient(135deg,#0A74DA,#00C48C);color:#fff;padding:32px 40px;display:flex;justify-content:space-between;align-items:center}
  .head h1{margin:0;font-size:22px}
  .head .nr{text-align:right;font-size:13px;opacity:.9}
  .body{padding:32px 40px}
  .row{display:flex;justify-content:space-between;margin-bottom:24px}
  .muted{color:#6B7280;font-size:13px}
  table{width:100%;border-collapse:collapse;margin-top:16px}
  th,td{text-align:left;padding:12px;border-bottom:1px solid #eee;font-size:14px}
  th{color:#6B7280;text-transform:uppercase;font-size:11px}
  .total{text-align:right;font-size:20px;font-weight:bold;margin-top:24px}
  .badge{display:inline-block;padding:6px 14px;border-radius:999px;font-size:12px;font-weight:bold}
  .paid{background:#d1fae5;color:#047857}.pending{background:#fef3c7;color:#b45309}.overdue{background:#fee2e2;color:#dc2626}
  .foot{padding:20px 40px;background:#f0f8ff;color:#9ca3af;font-size:12px;text-align:center}
  @media print{body{background:#fff;padding:0}.doc{box-shadow:none}}
</style></head>
<body>
  <div class="doc">
    <div class="head">
      <h1>🏥 Clínica Bem Estar</h1>
      <div class="nr">
        <div>FATURA Nº ${payment.id.slice(-6).toUpperCase()}</div>
        <div>${formatDate(payment.createdAt)}</div>
      </div>
    </div>
    <div class="body">
      <div class="row">
        <div>
          <div class="muted">Faturado a</div>
          <strong>${payment.patient.user.name}</strong><br>
          <span class="muted">${payment.patient.user.email}</span>
        </div>
        <div style="text-align:right">
          <div class="muted">Estado</div>
          <span class="badge ${payment.status === "PAID" ? "paid" : payment.status === "OVERDUE" ? "overdue" : "pending"}">${statusLabel}</span>
        </div>
      </div>
      <table>
        <thead><tr><th>Descrição</th><th style="text-align:right">Valor</th></tr></thead>
        <tbody>
          <tr><td>${payment.description || "Serviço clínico"}</td><td style="text-align:right">${formatCurrency(Number(payment.amount))}</td></tr>
        </tbody>
      </table>
      <div class="total">Total: ${formatCurrency(Number(payment.amount))}</div>
      ${payment.dueDate ? `<p class="muted">Data limite de pagamento: ${formatDate(payment.dueDate)}</p>` : ""}
      ${payment.paymentDate ? `<p class="muted">Pago em: ${formatDate(payment.paymentDate)}</p>` : ""}
    </div>
    <div class="foot">Clínica Bem Estar · Av. da Liberdade 154, Lisboa · NIF 500 000 000 · Documento gerado automaticamente</div>
  </div>
  <script>window.print&&setTimeout(()=>{try{window.print()}catch(e){}},400)</script>
</body></html>`;

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
