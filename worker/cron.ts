import cron from "node-cron";
import { prisma } from "../lib/prisma";
import { sendEmail, emailTemplate } from "../lib/email";
import { notify } from "../lib/notifications";

/**
 * Worker de automações da Clínica Bem Estar.
 * Executar com: npm run cron
 */

// 08:00 — lembretes de consultas de amanhã
async function appointmentReminders() {
  const start = new Date();
  start.setDate(start.getDate() + 1);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setHours(23, 59, 59, 999);

  const appointments = await prisma.appointment.findMany({
    where: {
      dateTime: { gte: start, lte: end },
      status: { in: ["PENDING", "CONFIRMED"] },
      reminderSent: false,
    },
    include: {
      patient: { include: { user: true } },
      doctor: { include: { user: true } },
    },
  });

  for (const a of appointments) {
    await notify({
      userId: a.patient.userId,
      type: "LEMBRETE_CONSULTA",
      title: "Lembrete de consulta",
      message: `Tem uma consulta amanhã com Dr(a). ${a.doctor.user.name} às ${a.dateTime.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" })}.`,
      link: "/patient/appointments",
    });
    await sendEmail({
      to: a.patient.user.email,
      subject: "Lembrete: consulta amanhã na Clínica Bem Estar",
      html: emailTemplate(
        "Lembrete de consulta",
        `Olá ${a.patient.user.name},<br><br>Lembramos que tem uma consulta marcada para <strong>amanhã</strong> com Dr(a). ${a.doctor.user.name} (${a.doctor.specialty}).<br><br>Contamos consigo!`,
      ),
    });
    await prisma.appointment.update({
      where: { id: a.id },
      data: { reminderSent: true },
    });
  }
  console.log(`[cron] ${appointments.length} lembretes de consulta enviados.`);
}

// 09:00 — marcar pagamentos em atraso (>30 dias) e alertar admin
async function flagOverduePayments() {
  const threshold = new Date();
  threshold.setDate(threshold.getDate() - 30);

  const overdue = await prisma.payment.findMany({
    where: {
      status: "PENDING",
      dueDate: { lt: new Date() },
      createdAt: { lt: threshold },
    },
    include: { patient: { include: { user: true } } },
  });

  for (const p of overdue) {
    await prisma.payment.update({
      where: { id: p.id },
      data: { status: "OVERDUE", overdueFlagged: true },
    });
    await notify({
      userId: p.patient.userId,
      type: "PAGAMENTO_PENDENTE",
      title: "Pagamento em atraso",
      message: `O pagamento de ${Number(p.amount)}€ encontra-se em atraso. Regularize o quanto antes.`,
      link: "/patient/payments",
    });
  }

  const admins = await prisma.user.findMany({ where: { role: "ADMIN" } });
  if (overdue.length > 0) {
    for (const admin of admins) {
      await notify({
        userId: admin.id,
        type: "PAGAMENTO_PENDENTE",
        title: "Pagamentos em atraso",
        message: `${overdue.length} pagamentos foram marcados como em atraso.`,
        link: "/admin/payments",
      });
    }
  }
  console.log(`[cron] ${overdue.length} pagamentos marcados em atraso.`);
}

// Segunda-feira 09:00 — relatório semanal para admin
async function weeklyReport() {
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const [consults, revenue, newPatients] = await Promise.all([
    prisma.consultation.count({ where: { createdAt: { gte: weekAgo } } }),
    prisma.payment.aggregate({ _sum: { amount: true }, where: { status: "PAID", paymentDate: { gte: weekAgo } } }),
    prisma.patient.count({ where: { createdAt: { gte: weekAgo } } }),
  ]);

  const admins = await prisma.user.findMany({ where: { role: "ADMIN" } });
  for (const admin of admins) {
    await notify({
      userId: admin.id,
      type: "SISTEMA",
      title: "Relatório semanal",
      message: `Semana: ${consults} consultas · ${Number(revenue._sum.amount ?? 0)}€ receita · ${newPatients} novos pacientes.`,
      link: "/admin/reports",
    });
    await sendEmail({
      to: admin.email,
      subject: "Relatório semanal — Clínica Bem Estar",
      html: emailTemplate(
        "Resumo semanal",
        `Consultas realizadas: <strong>${consults}</strong><br>Receita recebida: <strong>${Number(revenue._sum.amount ?? 0)}€</strong><br>Novos pacientes: <strong>${newPatients}</strong>`,
      ),
    });
  }
  console.log("[cron] Relatório semanal enviado.");
}

// Diário — alertas de renovação de receita (3 dias antes de terminar)
async function prescriptionRenewalAlerts() {
  const prescriptions = await prisma.prescription.findMany({
    where: { renewalAlertSent: false },
    include: { consultation: { include: { patient: { include: { user: true } } } } },
  });

  let count = 0;
  const now = Date.now();
  for (const p of prescriptions) {
    const end = new Date(p.startDate);
    end.setDate(end.getDate() + p.durationDays);
    const daysLeft = Math.ceil((end.getTime() - now) / (1000 * 60 * 60 * 24));
    if (daysLeft <= 3 && daysLeft >= 0) {
      await notify({
        userId: p.consultation.patient.userId,
        type: "RENOVACAO_RECEITA",
        title: "Renovação de receita",
        message: `O medicamento ${p.medicationName} termina em ${daysLeft} dia(s). Contacte a clínica para renovar.`,
        link: "/patient/prescriptions",
      });
      await prisma.prescription.update({
        where: { id: p.id },
        data: { renewalAlertSent: true },
      });
      count++;
    }
  }
  console.log(`[cron] ${count} alertas de renovação de receita enviados.`);
}

function schedule() {
  cron.schedule("0 8 * * *", appointmentReminders);
  cron.schedule("0 9 * * *", flagOverduePayments);
  cron.schedule("0 9 * * 1", weeklyReport);
  cron.schedule("30 8 * * *", prescriptionRenewalAlerts);
  console.log("⏰ Worker de automações ativo (lembretes, atrasos, relatórios, renovações).");
}

// Execução manual: `npm run cron -- --run-now`
if (process.argv.includes("--run-now")) {
  (async () => {
    await appointmentReminders();
    await flagOverduePayments();
    await prescriptionRenewalAlerts();
    await weeklyReport();
    process.exit(0);
  })();
} else {
  schedule();
}
