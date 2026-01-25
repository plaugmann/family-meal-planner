import * as React from "react";
import { HeartHandshake } from "lucide-react";

import { cn } from "@/lib/utils";

type EmptyStateProps = {
  title: string;
  description: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
};

export function EmptyState({
  title,
  description,
  action,
  icon,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-card/70 p-8 text-center",
        className
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent text-foreground">
        {icon ?? <HeartHandshake className="h-6 w-6" />}
      </div>
      <div>
        <p className="font-display text-lg font-semibold">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {action ? <div className="pt-2">{action}</div> : null}
    </div>
  );
}
