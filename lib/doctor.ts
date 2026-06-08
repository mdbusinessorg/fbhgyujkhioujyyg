import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api";

/**
 * Confirma que o médico tem relação com o paciente (consulta ou marcação).
 * Garante o isolamento de dados entre médicos.
 */
export async function assertDoctorOwnsPatient(
  doctorId: string,
  patientId: string,
) {
  const count = await prisma.appointment.count({
    where: { doctorId, patientId },
  });
  if (count === 0) {
    throw new ApiError("Este paciente não está atribuído a si", 403);
  }
}

export async function assertDoctorOwnsConsultation(
  doctorId: string,
  consultationId: string,
) {
  const consultation = await prisma.consultation.findUnique({
    where: { id: consultationId },
  });
  if (!consultation || consultation.doctorId !== doctorId) {
    throw new ApiError("Consulta não atribuída a si", 403);
  }
  return consultation;
}
