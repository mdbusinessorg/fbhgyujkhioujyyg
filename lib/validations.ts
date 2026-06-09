import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "A palavra-passe deve ter pelo menos 6 caracteres"),
  phone: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Palavra-passe obrigatória"),
});

export const patientProfileSchema = z.object({
  dob: z.string().optional(),
  gender: z.string().optional(),
  address: z.string().optional(),
  bloodType: z.string().optional(),
  allergies: z.string().optional(),
  chronicConditions: z.string().optional(),
  emergencyContact: z.string().optional(),
});

export const metricSchema = z.object({
  type: z.enum(["PESO", "ALTURA", "PRESSAO", "GLICEMIA"]),
  value: z.coerce.number().positive("Valor deve ser positivo"),
  valueSecondary: z.coerce.number().optional().nullable(),
});

export const appointmentSchema = z.object({
  patientId: z.string().min(1),
  doctorId: z.string().min(1),
  dateTime: z.string().min(1, "Data e hora obrigatórias"),
  reason: z.string().optional(),
});

export const publicBookingSchema = z.object({
  name: z.string().min(3),
  email: z.string().email(),
  phone: z.string().optional(),
  doctorId: z.string().min(1),
  dateTime: z.string().min(1),
  reason: z.string().optional(),
});

export const prescriptionSchema = z.object({
  medicationName: z.string().min(2),
  dosage: z.string().min(1),
  frequency: z.string().min(1),
  durationDays: z.coerce.number().int().positive(),
  instructions: z.string().optional(),
});

export const examSchema = z.object({
  examName: z.string().min(2),
  urgency: z.enum(["ROTINA", "PRIORITARIO", "URGENTE"]),
  notes: z.string().optional(),
});

export const consultationSchema = z.object({
  appointmentId: z.string().min(1),
  clinicalNotes: z.string().optional(),
});

export const paymentSchema = z.object({
  patientId: z.string().min(1),
  consultationId: z.string().optional().nullable(),
  amount: z.coerce.number().positive(),
  status: z.enum(["PAID", "PENDING", "OVERDUE"]),
  description: z.string().optional(),
  dueDate: z.string().optional(),
});

export const doctorSchema = z.object({
  name: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(6),
  phone: z.string().optional(),
  specialty: z.string().min(2),
  crm: z.string().min(2),
  bio: z.string().optional(),
  availableDays: z.string().optional(),
  availableHours: z.string().optional(),
});

export const treatmentPlanSchema = z.object({
  patientId: z.string().min(1),
  title: z.string().min(3),
  description: z.string().optional(),
  goals: z.array(z.string()).optional(),
  endDate: z.string().optional(),
});
