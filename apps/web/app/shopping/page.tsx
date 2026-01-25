"use client";

import * as React from "react";
import { CheckCircle2, Copy, ShoppingBasket } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import { SectionHeader } from "@/components/SectionHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { ShoppingListItem, WeeklyPlan } from "@/lib/types";

type ShoppingList = {
  weeklyPlanId: string;
  items: ShoppingListItem[];
};

const categoryLabels: Record<ShoppingListItem["category"], string> = {
  PRODUCE: "Produce",
  DAIRY: "Dairy",
  MEAT_FISH: "Meat & Fish",
  PANTRY: "Pantry",
  FROZEN: "Frozen",
  OTHER: "Other",
};

export default function ShoppingPage() {
  const [weeklyPlan, setWeeklyPlan] = React.useState<WeeklyPlan | null>(null);
  const [shoppingList, setShoppingList] = React.useState<ShoppingList | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [onlyUnbought, setOnlyUnbought] = React.useState(true);

  const fetchPlan = React.useCallback(async () => {
    const planRes = await fetch("/api/weekly-plan");
    const planJson = await planRes.json();
    setWeeklyPlan(planJson.weeklyPlan ?? null);
  }, []);

  const generateShoppingList = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      await fetchPlan();
      const response = await fetch("/api/shopping-list/generate", { method: "POST" });
      if (!response.ok) {
        if (response.status === 409) {
          setShoppingList(null);
          return;
        }
        const json = await response.json();
        throw new Error(json?.error?.message ?? "Unable to generate list.");
      }
      const json = await response.json();
      setShoppingList(json.shoppingList ?? null);
    } catch (err) {
      setError("We couldn't generate your shopping list.");
    } finally {
      setLoading(false);
    }
  }, [fetchPlan]);

  React.useEffect(() => {
    generateShoppingList();
  }, [generateShoppingList]);

  const handleToggleBought = async (item: ShoppingListItem) => {
    try {
      const response = await fetch(`/api/shopping-list/items/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isBought: !item.isBought }),
      });
      if (!response.ok) {
        throw new Error("Failed to update item.");
      }
      const json = await response.json();
      const updatedItem = json.item as ShoppingListItem;
      setShoppingList((prev) =>
        prev
          ? {
              ...prev,
              items: prev.items.map((existing) =>
                existing.id === updatedItem.id ? updatedItem : existing
              ),
            }
          : prev
      );
      if (!item.isBought) {
        toast.success("Added to inventory.");
      }
    } catch (err) {
      toast.error("Unable to update this item.");
    }
  };

  const grouped = React.useMemo(() => {
    if (!shoppingList) {
      return [];
    }
    const items = onlyUnbought
      ? shoppingList.items.filter((item) => !item.isBought)
      : shoppingList.items;
    const map = new Map<ShoppingListItem["category"], ShoppingListItem[]>();
    for (const item of items) {
      if (!map.has(item.category)) {
        map.set(item.category, []);
      }
      map.get(item.category)?.push(item);
    }
    return Array.from(map.entries());
  }, [shoppingList, onlyUnbought]);

  const handleCopy = async () => {
    if (!shoppingList) {
      return;
    }
    const lines = shoppingList.items
      .filter((item) => !item.isBought)
      .map((item) => `${item.name}${item.quantityText ? ` (${item.quantityText})` : ""}`);
    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      toast.success("Copied unbought items.");
    } catch (err) {
      toast.error("Unable to copy list.");
    }
  };

  return (
    <AppShell title="Shopping" subtitle="Everything you need for the week.">
      <div className="space-y-6">
        <SectionHeader
          title="Shopping list"
          subtitle="Generated from your three dinners."
          actions={
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" onClick={generateShoppingList}>
                Regenerate
              </Button>
              <Button variant="outline" onClick={handleCopy}>
                <Copy className="mr-2 h-4 w-4" />
                Copy list
              </Button>
            </div>
          }
        />

        <div className="flex items-center justify-between rounded-2xl border border-border bg-card px-4 py-3">
          <div>
            <p className="text-sm font-medium">Show only unbought</p>
            <p className="text-xs text-muted-foreground">Keep the list tidy while shopping.</p>
          </div>
          <Button
            variant={onlyUnbought ? "default" : "outline"}
            onClick={() => setOnlyUnbought((prev) => !prev)}
          >
            {onlyUnbought ? "On" : "Off"}
          </Button>
        </div>

        {loading ? <LoadingSkeleton count={3} /> : null}
        {error ? <ErrorState title="Shopping list unavailable" description={error} /> : null}

        {!loading && !error && (!weeklyPlan || weeklyPlan.items.length !== 3) ? (
          <EmptyState
            title="Plan three dinners first"
            description="Your shopping list appears after selecting three meals."
            icon={<ShoppingBasket className="h-6 w-6" />}
            action={
              <Button asChild>
                <a href="/this-week">Go to this week</a>
              </Button>
            }
          />
        ) : null}

        {!loading && !error && shoppingList && grouped.length === 0 ? (
          <EmptyState
            title="All items bought"
            description="You're all set for this week."
            icon={<CheckCircle2 className="h-6 w-6" />}
          />
        ) : null}

        <div className="space-y-4">
          {grouped.map(([category, items]) => (
            <Card key={category}>
              <CardContent className="space-y-3 pt-5">
                <p className="text-sm font-semibold text-muted-foreground">
                  {categoryLabels[category]}
                </p>
                <Separator />
                <div className="space-y-3">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-primary"
                        checked={item.isBought}
                        onChange={() => handleToggleBought(item)}
                      />
                      <div className="flex-1">
                        <p className={item.isBought ? "line-through text-muted-foreground" : ""}>
                          {item.name}
                        </p>
                        {item.quantityText ? (
                          <p className="text-xs text-muted-foreground">
                            Suggested pack: {item.quantityText}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
