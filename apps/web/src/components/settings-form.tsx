"use client";

import { useState } from "react";
import type { Profile } from "@repo/db";
import { useLang } from "./providers";

export function SettingsForm({ profile }: { profile: Profile }) {
  const { t } = useLang();
  const [locale, setLocale] = useState(profile.locale);
  const [currency, setCurrency] = useState(profile.currency);
  const [emailReports, setEmailReports] = useState(profile.email_reports_enabled);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setSaving(true);
    if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
      try {
        const { createClient } = await import("@/lib/supabase-browser");
        const supabase = createClient();
        await supabase
          .from("profiles")
          .update({ locale, currency, email_reports_enabled: emailReports })
          .eq("id", profile.id);
      } catch { /* demo mode */ }
    }
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function handleSignOut() {
    if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
      try {
        const { createClient } = await import("@/lib/supabase-browser");
        const supabase = createClient();
        await supabase.auth.signOut();
      } catch { /* demo mode */ }
    }
    window.location.href = "/login";
  }

  return (
    <div className="space-y-6">
      {/* Profile */}
      <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-[var(--shadow)] space-y-4">
        <h3 className="font-semibold">{t("settings.profile")}</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-xs font-medium text-[var(--muted-foreground)]">{t("settings.email")}</label>
            <p className="mt-1 font-medium">{profile.email}</p>
          </div>
          <div>
            <label className="text-xs font-medium text-[var(--muted-foreground)]">{t("settings.plan")}</label>
            <p className="mt-1">
              <span className="inline-flex items-center rounded-full bg-gradient-to-r from-[var(--gradient-from)] to-[var(--gradient-to)] px-2.5 py-0.5 text-xs font-semibold text-white capitalize">
                {profile.tier}
              </span>
            </p>
          </div>
        </div>
      </section>

      {/* Preferences */}
      <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-[var(--shadow)] space-y-5">
        <h3 className="font-semibold">{t("settings.preferences")}</h3>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[var(--muted-foreground)]">{t("settings.language")}</label>
            <select
              value={locale}
              onChange={(e) => setLocale(e.target.value as Profile["locale"])}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm outline-none transition-all focus:border-[var(--primary)]"
            >
              <option value="en">English</option>
              <option value="zh-CN">中文 (简体)</option>
              <option value="zh-HK">中文 (繁體)</option>
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[var(--muted-foreground)]">{t("settings.currency")}</label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value as Profile["currency"])}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm outline-none transition-all focus:border-[var(--primary)]"
            >
              <option value="USD">USD ($)</option>
              <option value="HKD">HKD (HK$)</option>
              <option value="CNY">CNY (¥)</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="emailReports"
            checked={emailReports}
            onChange={(e) => setEmailReports(e.target.checked)}
            className="h-4 w-4 rounded border-[var(--border)] accent-[var(--primary)]"
          />
          <label htmlFor="emailReports" className="text-sm">
            {t("settings.emailReports")}
          </label>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className={`rounded-lg px-5 py-2.5 text-sm font-medium transition-all ${
            saved
              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
              : "bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--primary-hover)] disabled:opacity-50"
          }`}
        >
          {saving ? t("settings.saving") : saved ? t("settings.saved") : t("settings.save")}
        </button>
      </section>

      {/* Sign out */}
      <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-[var(--shadow)]">
        <button
          onClick={handleSignOut}
          className="text-sm font-medium text-[var(--destructive)] transition-colors hover:underline"
        >
          {t("settings.signOut")}
        </button>
      </section>
    </div>
  );
}
