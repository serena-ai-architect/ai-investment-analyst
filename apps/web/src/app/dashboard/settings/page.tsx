import { safeQuery, isSupabaseConfigured, createClient } from "@/lib/supabase-server";
import { PageHeader } from "@/components/page-header";
import { SettingsForm } from "@/components/settings-form";
import type { Profile } from "@repo/db";

const DEFAULT_PROFILE: Profile = {
  id: "demo",
  email: "demo@example.com",
  full_name: "Demo User",
  avatar_url: null,
  locale: "en",
  currency: "USD",
  tier: "free",
  stripe_customer_id: null,
  notion_bot_token: null,
  notion_database_id: null,
  delivery_channels: ["web", "email"],
  email_reports_enabled: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export default async function SettingsPage() {
  let profile = DEFAULT_PROFILE;

  if (isSupabaseConfigured) {
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const result = await safeQuery<Profile>((sb) =>
          sb.from("profiles").select("*").eq("id", user.id).single()
        );
        if (result) profile = result;
      }
    } catch { /* demo mode */ }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader titleKey="settings.title" descriptionKey="settings.description" />
      <SettingsForm profile={profile} />
    </div>
  );
}
