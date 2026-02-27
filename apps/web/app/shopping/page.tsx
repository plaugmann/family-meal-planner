"use client";

import * as React from "react";
import { ShoppingBasket, Trash2, Edit2, Check, X, FileDown, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { EmptyState } from "@/components/EmptyState";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { generateShoppingListPdf } from "@/lib/pdf";
import type { ShoppingListItem, WeeklyPlan } from "@/lib/types";

function mergeIngredients(recipes: WeeklyPlan["recipes"]): { name: string; quantity: string | null }[] {
  const map = new Map<string, string[]>();

  for (const recipe of recipes) {
    for (const line of recipe.ingredients) {
      const cleaned = line.trim();
      if (!cleaned) continue;

      const key = cleaned.toLowerCase();
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key)!.push(recipe.title);
    }
  }

  return Array.from(map.entries()).map(([_, sources], i) => {
    const allIngredients = recipes.flatMap((r) => r.ingredients);
    const originalLine = allIngredients.find(
      (line) => line.trim().toLowerCase() === Array.from(map.keys())[i]
    ) ?? Array.from(map.keys())[i];

    return {
      name: originalLine,
      quantity: sources.length > 1 ? `Bruges i: ${sources.join(", ")}` : null,
    };
  });
}

export default function ShoppingPage() {
  const [plan, setPlan] = React.useState<WeeklyPlan | null>(null);
  const [items, setItems] = React.useState<ShoppingListItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [generating, setGenerating] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editName, setEditName] = React.useState("");
  const [editQuantity, setEditQuantity] = React.useState("");

  const fetchData = React.useCallback(async () => {
    try {
      setLoading(true);
      const [planRes, listRes] = await Promise.all([
        fetch("/api/weekly-plan"),
        fetch("/api/shopping-list"),
      ]);
      const planJson = await planRes.json();
      const listJson = await listRes.json();
      setPlan(planJson.weeklyPlan ?? null);
      setItems(listJson.items ?? []);
    } catch {
      toast.error("Kunne ikke hente data.");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const generateList = async () => {
    if (!plan || plan.recipes.length === 0) {
      toast.error("Tilføj opskrifter til ugeplanen først.");
      return;
    }

    setGenerating(true);
    try {
      const merged = mergeIngredients(plan.recipes);
      const res = await fetch("/api/shopping-list", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weeklyPlanId: plan.id, items: merged }),
      });
      if (!res.ok) throw new Error();
      const json = await res.json();
      setItems(json.items ?? []);
      toast.success("Indkøbsliste genereret!");
    } catch {
      toast.error("Kunne ikke generere indkøbsliste.");
    } finally {
      setGenerating(false);
    }
  };

  const handleToggleChecked = async (item: ShoppingListItem) => {
    try {
      const res = await fetch(`/api/shopping-list/items/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isChecked: !item.isChecked }),
      });
      if (!res.ok) throw new Error();
      const json = await res.json();
      setItems((prev) => prev.map((i) => (i.id === json.item.id ? json.item : i)));
    } catch {
      toast.error("Kunne ikke opdatere.");
    }
  };

  const handleDelete = async (item: ShoppingListItem) => {
    try {
      const res = await fetch(`/api/shopping-list/items/${item.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      toast.success("Fjernet fra listen.");
    } catch {
      toast.error("Kunne ikke fjerne.");
    }
  };

  const handleStartEdit = (item: ShoppingListItem) => {
    setEditingId(item.id);
    setEditName(item.name);
    setEditQuantity(item.quantity || "");
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditName("");
    setEditQuantity("");
  };

  const handleSaveEdit = async (item: ShoppingListItem) => {
    try {
      const res = await fetch(`/api/shopping-list/items/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName.trim(), quantity: editQuantity.trim() || null }),
      });
      if (!res.ok) throw new Error();
      const json = await res.json();
      setItems((prev) => prev.map((i) => (i.id === json.item.id ? json.item : i)));
      toast.success("Opdateret.");
      handleCancelEdit();
    } catch {
      toast.error("Kunne ikke opdatere.");
    }
  };

  const uncheckedItems = items.filter((i) => !i.isChecked);
  const checkedItems = items.filter((i) => i.isChecked);

  const handleDownloadPdf = () => {
    try {
      generateShoppingListPdf(
        uncheckedItems.map((item) => ({ name: item.name, quantity: item.quantity }))
      );
      toast.success("PDF downloadet.");
    } catch {
      toast.error("Kunne ikke generere PDF.");
    }
  };

  return (
    <AppShell
      title="Indkøbsliste"
      subtitle={items.length > 0 ? `${uncheckedItems.length} af ${items.length} mangler` : undefined}
      actions={
        <div className="flex gap-2">
          {uncheckedItems.length > 0 && (
            <Button variant="outline" size="sm" onClick={handleDownloadPdf}>
              <FileDown className="mr-2 h-4 w-4" />
              PDF
            </Button>
          )}
        </div>
      }
    >
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Generer indkøbsliste</p>
                <p className="text-xs text-muted-foreground">
                  Samler ingredienser fra ugens opskrifter.
                </p>
              </div>
              <Button onClick={generateList} disabled={generating || !plan}>
                {generating ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                {items.length > 0 ? "Generer ny" : "Generer"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {loading && <LoadingSkeleton count={3} />}

        {!loading && items.length === 0 && (
          <EmptyState
            title="Ingen indkøbsliste endnu"
            description="Tilføj opskrifter til ugeplanen og generer en indkøbsliste."
            icon={<ShoppingBasket className="h-6 w-6" />}
          />
        )}

        {uncheckedItems.length > 0 && (
          <Card>
            <CardContent className="space-y-3 pt-5">
              <p className="text-sm font-semibold text-muted-foreground">Mangler</p>
              <div className="space-y-3">
                {uncheckedItems.map((item) => (
                  <div key={item.id} className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-primary"
                      checked={false}
                      onChange={() => handleToggleChecked(item)}
                    />
                    <div className="flex-1">
                      {editingId === item.id ? (
                        <div className="space-y-2">
                          <input
                            type="text"
                            className="w-full rounded border border-border bg-background px-2 py-1 text-sm"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            placeholder="Ingrediens"
                          />
                          <input
                            type="text"
                            className="w-full rounded border border-border bg-background px-2 py-1 text-xs"
                            value={editQuantity}
                            onChange={(e) => setEditQuantity(e.target.value)}
                            placeholder="Mængde (valgfrit)"
                          />
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => handleSaveEdit(item)}>
                              <Check className="h-3 w-3" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className="text-sm">{item.name}</p>
                          {item.quantity && (
                            <p className="text-xs text-muted-foreground">{item.quantity}</p>
                          )}
                        </>
                      )}
                    </div>
                    {editingId !== item.id && (
                      <div className="flex gap-1 shrink-0">
                        <Button size="sm" variant="ghost" onClick={() => handleStartEdit(item)}>
                          <Edit2 className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleDelete(item)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {checkedItems.length > 0 && (
          <Card>
            <CardContent className="space-y-3 pt-5">
              <p className="text-sm font-semibold text-muted-foreground">Har allerede</p>
              <div className="space-y-3">
                {checkedItems.map((item) => (
                  <div key={item.id} className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-primary"
                      checked={true}
                      onChange={() => handleToggleChecked(item)}
                    />
                    <p className="flex-1 text-sm line-through text-muted-foreground">{item.name}</p>
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(item)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppShell>
  );
}
