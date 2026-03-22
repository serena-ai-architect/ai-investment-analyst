"use client";

import { useState, useCallback, useRef } from "react";
import type { PipelineEvent } from "@repo/core";
import { generateDemoTrace } from "@/lib/demo-trace";
import type { StreamStatus, PipelineStreamResult, UsePipelineStreamReturn } from "./usePipelineStream";

export function useDemoPlayback(speed: number = 1): UsePipelineStreamReturn {
  const [events, setEvents] = useState<PipelineEvent[]>([]);
  const [status, setStatus] = useState<StreamStatus>("idle");
  const [result, setResult] = useState<PipelineStreamResult | null>(null);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const reset = useCallback(() => {
    for (const t of timersRef.current) clearTimeout(t);
    timersRef.current = [];
    setEvents([]);
    setStatus("idle");
    setResult(null);
  }, []);

  const start = useCallback((company: string, _mode?: "quick" | "full") => {
    reset();
    setStatus("streaming");

    const { trace, qualityScore, riskScore } = generateDemoTrace(company);
    const timers: ReturnType<typeof setTimeout>[] = [];

    trace.forEach((item, i) => {
      const delay = item.delayMs / speed;
      const timer = setTimeout(() => {
        setEvents((prev) => [...prev, item.event]);

        if (i === trace.length - 1) {
          setStatus("complete");
          setResult({
            company,
            reportEn: `# ${company} Investment Analysis\n\nDemo report content...`,
            qualityScore,
            riskScore,
          });
        }
      }, delay);
      timers.push(timer);
    });

    timersRef.current = timers;
  }, [speed, reset]);

  return { events, status, result, error: null, start, reset };
}
