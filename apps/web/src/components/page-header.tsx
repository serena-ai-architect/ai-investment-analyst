"use client";

import { useLang } from "./providers";
import type { TranslationKey } from "@/lib/i18n";

export function PageHeader({ titleKey, descriptionKey }: { titleKey: TranslationKey; descriptionKey: TranslationKey }) {
  const { t } = useLang();
  return (
    <div>
      <h2 className="text-2xl font-bold">{t(titleKey)}</h2>
      <p className="text-[var(--muted-foreground)]">{t(descriptionKey)}</p>
    </div>
  );
}
