"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase-browser";
import type { Profile } from "@repo/db";

export function SettingsForm({ profile }: { profile: Profile }) {
  const [locale, setLocale] = useState(profile.locale);
  const [currency, setCurrency] = useState(profile.currency);
  const [emailReports, setEmailReports] = useState(profile.email_reports_enabled);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setSaving(true);
    const supabase = createClient();
    await supabase
      .from("profiles")
      .update({
        locale,
        currency,
        email_reports_enabled: emailReports,
      })
      .eq("id", profile.id);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  return (
    <div className="space-y-8">
      {/* Profile */}
      <section className="rounded-lg border border-[var(--border)] p-6 space-y-4">
        <h3 className="font-semibold">Profile</h3>
        <div>
          <label className="text-sm text-[var(--muted-foreground)]">Email</label>
          <p className="font-medium">{profile.email}</p>
        </div>
        <div>
          <label className="text-sm text-[var(--muted-foreground)]">Plan</label>
          <p className="font-medium capitalize">{profile.tier}</p>
        </div>
      </section>

      {/* Preferences */}
      <section className="rounded-lg border border-[var(--border)] p-6 space-y-4">
        <h3 className="font-semibold">Preferences</h3>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Language</label>
            <select
              value={locale}
              onChange={(e) => setLocale(e.target.value as Profile["locale"])}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
            >
              <option value="en">English</option>
              <option value="zh-CN">中文 (简体)</option>
              <option value="zh-HK">中文 (繁體)</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Currency</label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value as Profile["currency"])}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
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
            className="h-4 w-4 rounded border-[var(--border)]"
          />
          <label htmlFor="emailReports" className="text-sm">
            Email me when reports are ready
          </label>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)] transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {saving ? "Saving..." : saved ? "Saved!" : "Save Changes"}
        </button>
      </section>

      {/* Sign out */}
      <section className="rounded-lg border border-[var(--border)] p-6">
        <button
          onClick={handleSignOut}
          className="text-sm text-[var(--destructive)] hover:underline"
        >
          Sign Out
        </button>
      </section>
    </div>
  );
}
