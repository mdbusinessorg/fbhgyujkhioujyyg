import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { DashboardShell } from "@/components/dashboard/DashboardShell";

export default async function DoctorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireRole(["DOCTOR"]);
  if (!session) redirect("/login");

  return (
    <DashboardShell
      role="DOCTOR"
      name={session.user.name}
      email={session.user.email}
    >
      {children}
    </DashboardShell>
  );
}
