import type { ReactNode } from "react";

import { AmbientWash, type AmbientTone } from "@/components/ui/Surface";

/**
 * StaticPageShell — V7 "One World" (DESIGN_V3.md V7 addendum). The one
 * shared shell behind About, Trust & Safety, Support, Terms, Privacy, and
 * Refunds — these are the only pages in the product that are purely
 * *read*, not scanned or operated, so the editorial-magazine direction
 * from the Creative Strategy applies more directly here than anywhere
 * else: `font-editorial` on the one page title (used with real scarcity —
 * nowhere else on the page), a restrained per-page `AmbientWash` mood, and
 * a thin rule between sections instead of undifferentiated whitespace.
 * No signature threshold moment here on purpose — nobody "crosses"
 * into a Refund Policy; the craft budget goes into typography instead.
 */

interface StaticPageShellProps {
  title: string;
  subtitle?: string;
  updated?: string;
  /** A loose per-page mood, mapped to an AmbientWash tone pair. */
  mood?: "warm" | "calm" | "quiet";
  children: ReactNode;
}

const MOOD_TONES: Record<"warm" | "calm" | "quiet", [AmbientTone, AmbientTone]> = {
  warm: ["gold", "forest"],
  calm: ["sky", "sand"],
  quiet: ["sand", "clay"],
};

export function StaticPageShell({ title, subtitle, updated, mood = "warm", children }: StaticPageShellProps) {
  return (
    <div className="container-page relative py-12">
      <AmbientWash tones={MOOD_TONES[mood]} />
      <div className="relative mx-auto max-w-2xl">
        <h1 className="font-editorial text-4xl font-semibold tracking-tight text-navy sm:text-[2.75rem]">{title}</h1>
        {subtitle && <p className="mt-3 text-lg leading-relaxed text-slate-600">{subtitle}</p>}
        {updated && <p className="mt-2 text-xs uppercase tracking-wide text-slate-400">Last updated: {updated}</p>}
        <div className="mt-10">{children}</div>
      </div>
    </div>
  );
}

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-t border-sand/60 pt-8 first:border-t-0 first:pt-0">
      <h2 className="font-display text-xl font-bold text-navy">{title}</h2>
      <div className="mt-2 space-y-3 leading-relaxed text-slate-600">{children}</div>
    </section>
  );
}

export function LegalNote() {
  return (
    <p className="rounded-card border border-accent/30 bg-accent-subtle px-4 py-3 text-sm text-slate-600">
      This document is a working baseline written by the product team. Have qualified counsel review it for your
      jurisdiction before public launch.
    </p>
  );
}
