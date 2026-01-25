import * as React from "react";

import { cn } from "@/lib/utils";

type SectionHeaderProps = {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  className?: string;
};

export function SectionHeader({ title, subtitle, actions, className }: SectionHeaderProps) {
  return (
    <div className={cn("flex flex-col gap-2 md:flex-row md:items-center md:justify-between", className)}>
      <div>
        <h2 className="font-display text-xl font-semibold">{title}</h2>
        {subtitle ? <p className="text-sm text-muted-foreground">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  );
}
