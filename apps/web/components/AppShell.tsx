"use client";

import * as React from "react";
import Link from "next/link";
import { Settings } from "lucide-react";

import { BottomNav } from "@/components/BottomNav";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

type AppShellProps = {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
};

export function AppShell({ title, subtitle, actions, children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-rose-50 text-foreground dark:from-slate-900 dark:via-slate-950 dark:to-amber-950">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-4">
          <div>
            <p className="font-display text-2xl font-semibold">{title}</p>
            {subtitle ? (
              <p className="text-sm text-muted-foreground">{subtitle}</p>
            ) : null}
          </div>
          <div className={cn("flex items-center gap-2", actions ? "pl-2" : "")}>
            {actions}
            <Link
              href="/settings/whitelist"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition hover:text-foreground"
              aria-label="Open settings"
            >
              <Settings className="h-4 w-4" />
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-4 pb-28 pt-6">{children}</main>

      <BottomNav />
    </div>
  );
}
