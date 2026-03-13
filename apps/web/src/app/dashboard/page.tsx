import { cookies } from "next/headers";
import { DashboardContent } from "@/components/dashboard-content";
import { DEMO_REPORTS, DEMO_USAGE } from "@/lib/demo-data";

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const mvpEmail = cookieStore.get("mvp_email")?.value;
  const userName = mvpEmail
    ? decodeURIComponent(mvpEmail).split("@")[0]
    : "Demo User";

  // MVP: always use demo data
  const reports = DEMO_REPORTS;
  const usage = DEMO_USAGE;

  return <DashboardContent userName={userName} reports={reports} usage={usage} />;
}
