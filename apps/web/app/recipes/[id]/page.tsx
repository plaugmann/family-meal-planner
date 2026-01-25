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

export default function RecipeDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [recipe, setRecipe] = React.useState<RecipeDetail | null>(null);
  const [recipes, setRecipes] = React.useState<Recipe[]>([]);
  const [weeklyPlan, setWeeklyPlan] = React.useState<WeeklyPlan | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [replaceDialogOpen, setReplaceDialogOpen] = React.useState(false);
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
                  <p className="text-sm text-muted-foreground">{recipe.servings} servings</p>
                </div>
                <Button variant="ghost" size="icon" onClick={toggleFavorite}>
                  <Heart className={recipe.isFavorite ? "h-5 w-5 fill-rose-500 text-rose-500" : "h-5 w-5"} />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {recipe.isFamilyFriendly ? <Badge variant="secondary">Family-friendly</Badge> : null}
                {recipe.sourceDomain ? <Badge variant="outline">{recipe.sourceDomain}</Badge> : null}
              </div>
              <Button onClick={handleSelect}>Select for this week</Button>
            </div>
          </div>

          <SectionHeader title="Ingredients" subtitle="Everything you need for this meal." />
          <Card>
            <CardContent className="space-y-2 pt-5">
              <ul className="list-disc space-y-2 pl-5 text-sm">
                {recipe.ingredients.map((ingredient) => (
                  <li key={ingredient.id}>{ingredient.line}</li>
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
    </AppShell>
  );
}
