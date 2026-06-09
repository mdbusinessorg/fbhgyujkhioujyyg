import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

export default async function GoPage() {
  const session = await getSession();
  if (!session?.user) redirect("/login");

  switch (session.user.role) {
    case "ADMIN":
      redirect("/admin");
    case "DOCTOR":
      redirect("/doctor");
    case "PATIENT":
      redirect("/patient");
    default:
      redirect("/");
  }
}
