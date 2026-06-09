import { PrismaClient, Role, AppointmentStatus, PaymentStatus, Urgency, MetricType } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const DEMO_PASSWORD = "demo1234";

function daysFromNow(d: number) {
  const date = new Date();
  date.setDate(date.getDate() + d);
  return date;
}

async function main() {
  console.log("🌱 A iniciar seed da Clínica Bem Estar...");

  // limpar dados existentes (ordem importa por causa das FKs)
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.healthMetric.deleteMany();
  await prisma.treatmentPlan.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.prescription.deleteMany();
  await prisma.examRequest.deleteMany();
  await prisma.consultation.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.doctor.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.user.deleteMany();

  const hash = await bcrypt.hash(DEMO_PASSWORD, 10);

  // ---- ADMIN ----
  await prisma.user.create({
    data: {
      name: "Sofia Almeida",
      email: "admin@clinicabemestar.pt",
      passwordHash: hash,
      role: Role.ADMIN,
      phone: "+351 211 234 567",
    },
  });

  // ---- MÉDICOS ----
  const doctorsData = [
    { name: "Ricardo Fonseca", email: "medico@clinicabemestar.pt", specialty: "Cardiologia", crm: "OM-48213", bio: "Especialista em cardiologia clínica e prevenção cardiovascular.", availableDays: "Seg-Sex", availableHours: "09:00-17:00" },
    { name: "Beatriz Carvalho", email: "beatriz.carvalho@clinicabemestar.pt", specialty: "Neurologia", crm: "OM-51902", bio: "Neurologista com foco em cefaleias e doenças neurodegenerativas.", availableDays: "Seg, Qua, Sex", availableHours: "10:00-18:00" },
    { name: "João Marques", email: "joao.marques@clinicabemestar.pt", specialty: "Medicina Geral e Familiar", crm: "OM-44310", bio: "Médico de família dedicado ao acompanhamento integral do paciente.", availableDays: "Ter-Sáb", availableHours: "08:00-15:00" },
  ];

  const doctors = [];
  for (const d of doctorsData) {
    const user = await prisma.user.create({
      data: {
        name: d.name,
        email: d.email,
        passwordHash: hash,
        role: Role.DOCTOR,
        phone: "+351 21 000 0000",
        doctor: {
          create: {
            specialty: d.specialty,
            crm: d.crm,
            bio: d.bio,
            availableDays: d.availableDays,
            availableHours: d.availableHours,
          },
        },
      },
      include: { doctor: true },
    });
    doctors.push(user.doctor!);
  }

  // ---- PACIENTES ----
  const patientsData = [
    { name: "Ana Martins", email: "paciente@clinicabemestar.pt", gender: "Feminino", blood: "A+", dob: "1989-03-12", allergies: "Penicilina", chronic: "Hipertensão arterial", emergency: "Pedro Martins · +351 912 000 111" },
    { name: "Carlos Pereira", email: "carlos.pereira@email.pt", gender: "Masculino", blood: "O+", dob: "1975-07-22", allergies: "—", chronic: "Diabetes tipo 2", emergency: "Marta Pereira · +351 913 222 333" },
    { name: "Mariana Sousa", email: "mariana.sousa@email.pt", gender: "Feminino", blood: "B-", dob: "1995-11-02", allergies: "Lactose", chronic: "—", emergency: "Rui Sousa · +351 914 444 555" },
    { name: "Tiago Oliveira", email: "tiago.oliveira@email.pt", gender: "Masculino", blood: "AB+", dob: "1982-01-30", allergies: "—", chronic: "Asma", emergency: "Sara Oliveira · +351 915 666 777" },
    { name: "Inês Rodrigues", email: "ines.rodrigues@email.pt", gender: "Feminino", blood: "A-", dob: "2000-05-18", allergies: "Pólen", chronic: "—", emergency: "Hugo Rodrigues · +351 916 888 999" },
    { name: "Pedro Costa", email: "pedro.costa@email.pt", gender: "Masculino", blood: "O-", dob: "1968-09-09", allergies: "Aspirina", chronic: "Colesterol elevado", emergency: "Lúcia Costa · +351 917 111 222" },
    { name: "Helena Ferreira", email: "helena.ferreira@email.pt", gender: "Feminino", blood: "B+", dob: "1991-12-25", allergies: "—", chronic: "—", emergency: "Nuno Ferreira · +351 918 333 444" },
    { name: "Miguel Santos", email: "miguel.santos@email.pt", gender: "Masculino", blood: "A+", dob: "1978-04-14", allergies: "Frutos secos", chronic: "Hipertensão arterial", emergency: "Rita Santos · +351 919 555 666" },
    { name: "Catarina Lopes", email: "catarina.lopes@email.pt", gender: "Feminino", blood: "AB-", dob: "1986-08-07", allergies: "—", chronic: "Hipotiroidismo", emergency: "Bruno Lopes · +351 910 777 888" },
    { name: "Rui Gonçalves", email: "rui.goncalves@email.pt", gender: "Masculino", blood: "O+", dob: "1999-02-19", allergies: "—", chronic: "—", emergency: "Ana Gonçalves · +351 911 999 000" },
  ];

  const patients = [];
  for (let i = 0; i < patientsData.length; i++) {
    const p = patientsData[i];
    const user = await prisma.user.create({
      data: {
        name: p.name,
        email: p.email,
        passwordHash: hash,
        role: Role.PATIENT,
        phone: `+351 92${i} 000 00${i}`,
        patient: {
          create: {
            dob: new Date(p.dob),
            gender: p.gender,
            bloodType: p.blood,
            address: "Rua das Flores, Lisboa",
            allergies: p.allergies === "—" ? null : p.allergies,
            chronicConditions: p.chronic === "—" ? null : p.chronic,
            emergencyContact: p.emergency,
            onboarded: i < 8, // 2 pacientes sem onboarding
          },
        },
      },
      include: { patient: true },
    });
    patients.push(user.patient!);
  }

  // ---- MÉTRICAS DE SAÚDE ----
  for (const patient of patients.slice(0, 6)) {
    for (let w = 6; w >= 0; w--) {
      await prisma.healthMetric.create({
        data: {
          patientId: patient.id,
          type: MetricType.PESO,
          value: 70 + Math.round(Math.random() * 20) - w * 0.3,
          unit: "kg",
          recordedAt: daysFromNow(-w * 7),
        },
      });
      const sys = 118 + Math.round(Math.random() * 30);
      const dia = 76 + Math.round(Math.random() * 18);
      await prisma.healthMetric.create({
        data: {
          patientId: patient.id,
          type: MetricType.PRESSAO,
          value: sys,
          valueSecondary: dia,
          unit: "mmHg",
          abnormal: sys >= 140 || dia >= 90,
          recordedAt: daysFromNow(-w * 7),
        },
      });
      await prisma.healthMetric.create({
        data: {
          patientId: patient.id,
          type: MetricType.GLICEMIA,
          value: 85 + Math.round(Math.random() * 50),
          unit: "mg/dL",
          recordedAt: daysFromNow(-w * 7),
        },
      });
    }
  }

  // ---- CONSULTAS PASSADAS (concluídas) com receitas/exames/pagamentos ----
  const meds = [
    { medicationName: "Lisinopril", dosage: "10mg", frequency: "1x/dia", durationDays: 30, instructions: "Tomar de manhã, em jejum." },
    { medicationName: "Metformina", dosage: "850mg", frequency: "2x/dia", durationDays: 60, instructions: "Tomar às refeições." },
    { medicationName: "Atorvastatina", dosage: "20mg", frequency: "1x/dia", durationDays: 90, instructions: "Tomar ao deitar." },
    { medicationName: "Salbutamol", dosage: "100mcg", frequency: "SOS", durationDays: 30, instructions: "Em caso de falta de ar." },
  ];
  const exams = [
    { examName: "Hemograma completo", urgency: Urgency.ROTINA },
    { examName: "Eletrocardiograma", urgency: Urgency.PRIORITARIO },
    { examName: "Análise de glicemia em jejum", urgency: Urgency.ROTINA },
    { examName: "Ressonância magnética cerebral", urgency: Urgency.URGENTE },
  ];

  // Preços de consulta realistas (Kwanza) por especialidade
  const consultaPreco: Record<string, number> = {
    Cardiologia: 35000,
    Neurologia: 40000,
    "Medicina Geral e Familiar": 15000,
  };

  for (let i = 0; i < 8; i++) {
    const patient = patients[i % patients.length];
    const doctor = doctors[i % doctors.length];
    const apptDate = daysFromNow(-(i + 1) * 3);

    const appointment = await prisma.appointment.create({
      data: {
        patientId: patient.id,
        doctorId: doctor.id,
        dateTime: apptDate,
        status: AppointmentStatus.COMPLETED,
        reason: ["Consulta de rotina", "Dor torácica", "Seguimento", "Renovação de receita"][i % 4],
        createdBy: "seed",
      },
    });

    const consultation = await prisma.consultation.create({
      data: {
        appointmentId: appointment.id,
        patientId: patient.id,
        doctorId: doctor.id,
        clinicalNotes: "Paciente apresenta-se estável. Mantém-se o plano terapêutico e recomenda-se seguimento regular.",
        completedAt: apptDate,
        createdAt: apptDate,
      },
    });

    await prisma.prescription.create({
      data: { consultationId: consultation.id, ...meds[i % meds.length], startDate: apptDate },
    });

    await prisma.examRequest.create({
      data: {
        consultationId: consultation.id,
        examName: exams[i % exams.length].examName,
        urgency: exams[i % exams.length].urgency,
        status: i % 2 === 0 ? "COMPLETED" : "REQUESTED",
        notes: "Trazer resultados na próxima consulta.",
        createdAt: apptDate,
      },
    });

    const status = i % 3 === 0 ? PaymentStatus.PAID : i % 3 === 1 ? PaymentStatus.PENDING : PaymentStatus.OVERDUE;
    await prisma.payment.create({
      data: {
        patientId: patient.id,
        consultationId: consultation.id,
        amount: consultaPreco[doctor.specialty] ?? 25000,
        status,
        description: `Consulta de ${doctor.specialty}`,
        dueDate: daysFromNow(status === PaymentStatus.OVERDUE ? -10 : 20),
        paymentDate: status === PaymentStatus.PAID ? apptDate : null,
        overdueFlagged: status === PaymentStatus.OVERDUE,
        createdAt: apptDate,
      },
    });
  }

  // ---- CONSULTAS FUTURAS (pendentes/confirmadas) ----
  for (let i = 0; i < 6; i++) {
    const patient = patients[i % patients.length];
    const doctor = doctors[i % doctors.length];
    await prisma.appointment.create({
      data: {
        patientId: patient.id,
        doctorId: doctor.id,
        dateTime: daysFromNow(i + 1),
        status: i % 2 === 0 ? AppointmentStatus.CONFIRMED : AppointmentStatus.PENDING,
        reason: ["Consulta de seguimento", "Avaliação geral", "Resultados de exames"][i % 3],
        createdBy: "seed",
      },
    });
  }

  // ---- PLANOS DE TRATAMENTO ----
  await prisma.treatmentPlan.create({
    data: {
      patientId: patients[0].id,
      doctorId: doctors[0].id,
      title: "Controlo da hipertensão",
      description: "Plano de 3 meses para estabilização da pressão arterial.",
      goals: ["Reduzir consumo de sal", "Caminhar 30 min por dia", "Medir pressão 2x por semana", "Tomar medicação diariamente"],
      endDate: daysFromNow(90),
    },
  });
  await prisma.treatmentPlan.create({
    data: {
      patientId: patients[1].id,
      doctorId: doctors[2].id,
      title: "Gestão da diabetes tipo 2",
      description: "Acompanhamento nutricional e controlo glicémico.",
      goals: ["Dieta com baixo índice glicémico", "Exercício 3x por semana", "Monitorizar glicemia diariamente"],
      endDate: daysFromNow(120),
    },
  });

  // ---- NOTIFICAÇÕES DE EXEMPLO ----
  const patientUser = await prisma.user.findUnique({ where: { email: "paciente@clinicabemestar.pt" } });
  if (patientUser) {
    await prisma.notification.createMany({
      data: [
        { userId: patientUser.id, type: "LEMBRETE_CONSULTA", title: "Consulta agendada", message: "Tem uma consulta de cardiologia esta semana.", link: "/patient/appointments" },
        { userId: patientUser.id, type: "RENOVACAO_RECEITA", title: "Renovação de receita", message: "O Lisinopril termina em breve.", link: "/patient/prescriptions" },
      ],
    });
  }

  console.log("✅ Seed concluído!");
  console.log("\n🔑 Credenciais de demonstração (palavra-passe: demo1234):");
  console.log("   Admin:    admin@clinicabemestar.pt");
  console.log("   Médico:   medico@clinicabemestar.pt");
  console.log("   Paciente: paciente@clinicabemestar.pt");
}

main()
  .catch((e) => {
    console.error("❌ Erro no seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
