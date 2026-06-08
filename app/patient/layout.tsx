import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { DashboardShell } from "@/components/dashboard/DashboardShell";

export default async function PatientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireRole(["PATIENT"]);
  if (!session) redirect("/login");

  return (
    <DashboardShell
      role="PATIENT"
      name={session.user.name}
      email={session.user.email}
    >
      {children}
    </DashboardShell>
  );
}
