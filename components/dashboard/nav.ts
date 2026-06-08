import {
  LayoutDashboard,
  Users,
  Stethoscope,
  CalendarDays,
  CreditCard,
  ScrollText,
  FileBarChart,
  User,
  Pill,
  FlaskConical,
  ClipboardList,
  HeartPulse,
  type LucideIcon,
} from "lucide-react";
import { Role } from "@prisma/client";

export type NavItem = { href: string; label: string; icon: LucideIcon };

export const navByRole: Record<Role, NavItem[]> = {
  ADMIN: [
    { href: "/admin", label: "Visão Geral", icon: LayoutDashboard },
    { href: "/admin/patients", label: "Pacientes", icon: Users },
    { href: "/admin/doctors", label: "Médicos", icon: Stethoscope },
    { href: "/admin/appointments", label: "Consultas", icon: CalendarDays },
    { href: "/admin/payments", label: "Pagamentos", icon: CreditCard },
    { href: "/admin/audit", label: "Auditoria", icon: ScrollText },
    { href: "/admin/reports", label: "Relatórios", icon: FileBarChart },
  ],
  DOCTOR: [
    { href: "/doctor", label: "Visão Geral", icon: LayoutDashboard },
    { href: "/doctor/schedule", label: "Agenda", icon: CalendarDays },
  ],
  PATIENT: [
    { href: "/patient", label: "Visão Geral", icon: LayoutDashboard },
    { href: "/patient/profile", label: "Perfil & Métricas", icon: User },
    { href: "/patient/appointments", label: "Consultas", icon: CalendarDays },
    { href: "/patient/prescriptions", label: "Receitas", icon: Pill },
    { href: "/patient/exams", label: "Exames", icon: FlaskConical },
    { href: "/patient/payments", label: "Pagamentos", icon: CreditCard },
    { href: "/patient/plan", label: "Plano de Tratamento", icon: ClipboardList },
  ],
};

export const roleLabels: Record<Role, string> = {
  ADMIN: "Administração",
  DOCTOR: "Área Clínica",
  PATIENT: "Portal do Paciente",
};

export const icons = { HeartPulse };
