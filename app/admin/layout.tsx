import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { DashboardShell } from "@/components/dashboard/DashboardShell";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireRole(["ADMIN"]);
  if (!session) redirect("/login");

  return (
    <DashboardShell
      role="ADMIN"
      name={session.user.name}
      email={session.user.email}
    >
      {children}
    </DashboardShell>
  );
}
