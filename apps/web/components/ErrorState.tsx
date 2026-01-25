import * as React from "react";
import { AlertTriangle } from "lucide-react";

import { cn } from "@/lib/utils";

type ErrorStateProps = {
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
};

export function ErrorState({ title, description, action, className }: ErrorStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-center",
        className
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
        <AlertTriangle className="h-6 w-6" />
      </div>
      <div>
        <p className="font-display text-lg font-semibold">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {action ? <div className="pt-2">{action}</div> : null}
    </div>
  );
}
