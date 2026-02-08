"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { ErrorState } from "@/components/ErrorState";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import { RecipePickerDialog } from "@/components/RecipePickerDialog";
import { SectionHeader } from "@/components/SectionHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useDraftPlan } from "@/lib/draft-plan";
import type { Recipe, RecipeDetail, WeeklyPlan } from "@/lib/types";

const MAX_ITEMS = 3;

function getWeekStartIso() {
  const now = new Date();
  const utc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const day = utc.getUTCDay();
  const diff = (day + 6) % 7;
  utc.setUTCDate(utc.getUTCDate() - diff);
  utc.setUTCHours(0, 0, 0, 0);
  return utc.toISOString();
}

const FRACTIONS: Record<string, number> = {
  "¼": 0.25,
  "½": 0.5,
  "¾": 0.75,
  "⅓": 1 / 3,
  "⅔": 2 / 3,
  "⅛": 0.125,
  "⅜": 0.375,
  "⅝": 0.625,
  "⅞": 0.875,
};

function parseAmountToken(token: string) {
  const trimmed = token.trim();
  if (FRACTIONS[trimmed] !== undefined) {
    return FRACTIONS[trimmed];
  }
  if (trimmed.includes("/")) {
    const [num, den] = trimmed.split("/").map((value) => Number(value));
    if (Number.isFinite(num) && Number.isFinite(den) && den !== 0) {
      return num / den;
    }
  }
  const normalized = trimmed.replace(",", ".");
  const value = Number(normalized);
  return Number.isFinite(value) ? value : null;
}

function formatAmount(value: number) {
  if (Number.isInteger(value)) {
    return value.toString();
  }
  const rounded = Math.round(value * 100) / 100;
  return rounded.toString().replace(/\.0+$/, "");
}

function scaleIngredientLine(line: string, fromServings: number, toServings: number) {
  if (!fromServings || !toServings || fromServings === toServings) {
    return line;
  }
  const factor = toServings / fromServings;
  return line.replace(/(\d+\s+\d+\/\d+|\d+\/\d+|\d+[.,]?\d*|[¼½¾⅓⅔⅛⅜⅝⅞])(?!%)/g, (match) => {
    const parts = match.split(" ");
    let amount = 0;
    if (parts.length === 2) {
      const first = parseAmountToken(parts[0]);
      const second = parseAmountToken(parts[1]);
      if (first === null || second === null) {
        return match;
      }
      amount = first + second;
    } else {
      const parsed = parseAmountToken(match);
      if (parsed === null) {
        return match;
      }
      amount = parsed;
    }
    const scaled = amount * factor;
    return formatAmount(scaled);
  });
}

export default function RecipeDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [recipe, setRecipe] = React.useState<RecipeDetail | null>(null);
  const [recipes, setRecipes] = React.useState<Recipe[]>([]);
  const [weeklyPlan, setWeeklyPlan] = React.useState<WeeklyPlan | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [replaceDialogOpen, setReplaceDialogOpen] = React.useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = React.useState(false);
  const [servings, setServings] = React.useState(4);
  const { draftIds, add: addDraft, clear: clearDraft } = useDraftPlan();

  const hasPlan = weeklyPlan?.items?.length === MAX_ITEMS;

  const fetchData = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [recipeRes, planRes, recipesRes] = await Promise.all([
        fetch(`/api/recipes/${params.id}`),
        fetch("/api/weekly-plan"),
        fetch("/api/recipes"),
      ]);
      if (!recipeRes.ok || !planRes.ok || !recipesRes.ok) {
        throw new Error("Failed to load recipe.");
      }
      const recipeJson = await recipeRes.json();
      const planJson = await planRes.json();
      const recipesJson = await recipesRes.json();
      setRecipe(recipeJson.recipe ?? null);
      setWeeklyPlan(planJson.weeklyPlan ?? null);
      setRecipes(recipesJson.recipes ?? []);
    } catch (err) {
      setError("Unable to load this recipe.");
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  React.useEffect(() => {
    if (recipe?.servings) {
      setServings(recipe.servings);
    }
  }, [recipe]);

  React.useEffect(() => {
    if (weeklyPlan || draftIds.length !== MAX_ITEMS) {
      return;
    }
    const saveDraft = async () => {
      try {
        const items = draftIds.map((id) => ({ recipeId: id, servings: 4 }));
        const response = await fetch("/api/weekly-plan", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ weekStart: getWeekStartIso(), items }),
        });
        if (!response.ok) {
          throw new Error("Failed to save plan.");
        }
        clearDraft();
        await fetchData();
        toast.success("Weekly plan saved.");
      } catch (err) {
        toast.error("Unable to save weekly plan.");
      }
    };
    saveDraft();
  }, [weeklyPlan, draftIds, clearDraft, fetchData]);

  const handleSelect = () => {
    if (!recipe) {
      return;
    }
    if (hasPlan) {
      setReplaceDialogOpen(true);
      return;
    }
    if (draftIds.includes(recipe.id)) {
      toast.message("Already added to this week.");
      return;
    }
    addDraft(recipe.id);
    toast.success("Added to this week.");
  };

  const handleReplaceConfirm = async (replaceId: string) => {
    if (!weeklyPlan || !recipe) {
      return;
    }
    const nextItems = weeklyPlan.items.map((item) =>
      item.recipeId === replaceId
        ? { recipeId: recipe.id, servings: item.servings }
        : { recipeId: item.recipeId, servings: item.servings }
    );
    try {
      const response = await fetch("/api/weekly-plan", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          weekStart: weeklyPlan.weekStart,
          items: nextItems,
        }),
      });
      if (!response.ok) {
        throw new Error("Failed to update plan.");
      }
      toast.success("Weekly plan updated.");
      setReplaceDialogOpen(false);
      await fetchData();
    } catch (err) {
      toast.error("Unable to update the plan.");
    }
  };

  const toggleFavorite = async () => {
    if (!recipe) {
      return;
    }
    try {
      const response = await fetch(`/api/recipes/${recipe.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isFavorite: !recipe.isFavorite }),
      });
      const json = await response.json();
      if (!response.ok) {
        throw new Error("Failed to update.");
      }
      setRecipe(json.recipe);
      toast.success(json.recipe.isFavorite ? "Added to favorites." : "Removed from favorites.");
    } catch (err) {
      toast.error("Unable to update favorite.");
    }
  };

  const replaceOptions = weeklyPlan?.items
    ? weeklyPlan.items
        .map((item) => {
          const planRecipe = recipes.find((candidate) => candidate.id === item.recipeId);
          return {
            id: item.recipeId,
            title: planRecipe?.title ?? "Selected recipe",
            subtitle: "Replace this meal",
          };
        })
        .filter(Boolean)
    : [];

  const handleDelete = async () => {
    if (!recipe) {
      return;
    }
    try {
      const response = await fetch(`/api/recipes/${recipe.id}`, { method: "DELETE" });
      if (!response.ok) {
        throw new Error("Failed to delete.");
      }
      toast.success("Recipe removed.");
      router.push("/recipes");
    } catch (err) {
      toast.error("Unable to remove recipe.");
    } finally {
      setDeleteConfirmOpen(false);
    }
  };

  return (
    <AppShell title="Recipe" subtitle="Dinner details">
      {loading ? <LoadingSkeleton count={1} /> : null}
      {error ? <ErrorState title="Recipe unavailable" description={error} /> : null}

      {recipe ? (
        <div className="space-y-6">
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
            <div className="h-48 w-full overflow-hidden">
              <img
                src={recipe.imageUrl ?? "/icon.svg"}
                alt={recipe.title}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="space-y-4 p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-display text-2xl font-semibold">{recipe.title}</p>
                  <p className="text-sm text-muted-foreground">{servings} servings</p>
                </div>
                <Button variant="ghost" size="icon" onClick={toggleFavorite}>
                  <Heart className={recipe.isFavorite ? "h-5 w-5 fill-rose-500 text-rose-500" : "h-5 w-5"} />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {recipe.isFamilyFriendly ? <Badge variant="secondary">Family-friendly</Badge> : null}
                {recipe.sourceDomain ? <Badge variant="outline">{recipe.sourceDomain}</Badge> : null}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button onClick={handleSelect}>Select for this week</Button>
                <Button variant="destructive" onClick={() => setDeleteConfirmOpen(true)}>
                  Remove recipe
                </Button>
              </div>
            </div>
          </div>

          <SectionHeader
            title="Ingredients"
            subtitle="Everything you need for this meal."
            actions={
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setServings((current) => Math.max(1, current - 1))}
                >
                  -
                </Button>
                <span className="text-sm font-semibold">{servings} servings</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setServings((current) => current + 1)}
                >
                  +
                </Button>
              </div>
            }
          />
          <Card>
            <CardContent className="space-y-2 pt-5">
              <ul className="list-disc space-y-2 pl-5 text-sm">
                {recipe.ingredients.map((ingredient) => (
                  <li key={ingredient.id}>
                    {scaleIngredientLine(ingredient.line, recipe.servings || 4, servings)}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <SectionHeader title="Steps" subtitle="Simple, quick instructions." />
          <Card>
            <CardContent className="space-y-3 pt-5">
              {recipe.steps.map((step, index) => (
                <div key={`${index}-${step}`} className="flex items-start gap-3 text-sm">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-accent text-xs font-semibold">
                    {index + 1}
                  </div>
                  <p>{step}</p>
                </div>
              ))}
              <Separator />
              <Button variant="secondary" onClick={() => router.push("/recipes")}>
                Back to recipes
              </Button>
            </CardContent>
          </Card>
        </div>
      ) : null}

      <RecipePickerDialog
        open={replaceDialogOpen}
        onOpenChange={setReplaceDialogOpen}
        title="Replace a meal"
        description="Pick which dinner to swap out."
        options={replaceOptions}
        confirmLabel="Replace"
        onConfirm={handleReplaceConfirm}
      />

      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove recipe?</DialogTitle>
            <DialogDescription>
              This will permanently delete the recipe and its ingredients.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setDeleteConfirmOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
