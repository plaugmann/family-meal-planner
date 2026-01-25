"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type RecipePickerOption = {
  id: string;
  title: string;
  subtitle?: string;
};

type RecipePickerDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  options: RecipePickerOption[];
  confirmLabel?: string;
  onConfirm: (id: string) => void;
};

export function RecipePickerDialog({
  open,
  onOpenChange,
  title,
  description,
  options,
  confirmLabel = "Confirm",
  onConfirm,
}: RecipePickerDialogProps) {
  const [selectedId, setSelectedId] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) {
      setSelectedId(null);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>
        <div className="space-y-2">
          {options.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setSelectedId(option.id)}
              className={cn(
                "flex w-full items-center justify-between rounded-2xl border border-border px-4 py-3 text-left transition",
                selectedId === option.id
                  ? "border-primary bg-primary/10 text-foreground"
                  : "hover:border-primary/60"
              )}
            >
              <div>
                <p className="font-medium">{option.title}</p>
                {option.subtitle ? (
                  <p className="text-sm text-muted-foreground">{option.subtitle}</p>
                ) : null}
              </div>
            </button>
          ))}
        </div>
        <DialogFooter>
          <Button
            onClick={() => selectedId && onConfirm(selectedId)}
            disabled={!selectedId}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
