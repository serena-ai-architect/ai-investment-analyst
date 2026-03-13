import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard-shell";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const mvpEmail = cookieStore.get("mvp_email")?.value;

  if (!mvpEmail) redirect("/login");

  const userEmail = decodeURIComponent(mvpEmail);

  return <DashboardShell userEmail={userEmail}>{children}</DashboardShell>;
}
