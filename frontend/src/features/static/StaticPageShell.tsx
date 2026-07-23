import type { ReactNode } from "react";

interface StaticPageShellProps {
  title: string;
  subtitle?: string;
  updated?: string;
  children: ReactNode;
}

export function StaticPageShell({ title, subtitle, updated, children }: StaticPageShellProps) {
  return (
    <div className="container-page py-12">
      <div className="mx-auto max-w-2xl">
        <h1 className="font-display text-display-sm text-navy">{title}</h1>
        {subtitle && <p className="mt-3 text-lg text-slate-600">{subtitle}</p>}
        {updated && <p className="mt-2 text-xs uppercase tracking-wide text-slate-400">Last updated: {updated}</p>}
        <div className="mt-8 space-y-8">{children}</div>
      </div>
    </div>
  );
}

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
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
