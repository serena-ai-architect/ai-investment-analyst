"use client";

import { useState } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function ReportViewer({
  reportEn,
  reportZh,
}: {
  reportEn: string;
  reportZh?: string;
}) {
  const [lang, setLang] = useState<"en" | "zh">("en");
  const content = lang === "zh" && reportZh ? reportZh : reportEn;

  return (
    <div>
      {/* Language toggle */}
      {reportZh && (
        <div className="mb-4 flex gap-2">
          <button
            onClick={() => setLang("en")}
            className={`rounded-lg px-3 py-1 text-sm font-medium transition-colors ${
              lang === "en"
                ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                : "bg-[var(--muted)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            }`}
          >
            English
          </button>
          <button
            onClick={() => setLang("zh")}
            className={`rounded-lg px-3 py-1 text-sm font-medium transition-colors ${
              lang === "zh"
                ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                : "bg-[var(--muted)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            }`}
          >
            中文
          </button>
        </div>
      )}

      {/* Markdown content */}
      <article className="prose prose-sm max-w-none dark:prose-invert prose-headings:font-bold prose-table:text-sm">
        <Markdown remarkPlugins={[remarkGfm]}>{content}</Markdown>
      </article>
    </div>
  );
}
