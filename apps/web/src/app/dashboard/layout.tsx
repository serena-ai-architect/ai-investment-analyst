import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { DashboardShell } from "@/components/dashboard-shell";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  let userEmail = "demo@example.com";

  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) redirect("/login");
      userEmail = user.email ?? "user";
    } catch {
      // Supabase unavailable — continue in demo mode
    }
  }

  return <DashboardShell userEmail={userEmail}>{children}</DashboardShell>;
}
