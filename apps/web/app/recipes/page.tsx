"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import { RecipeCard } from "@/components/RecipeCard";
import { RecipePickerDialog } from "@/components/RecipePickerDialog";
import { SectionHeader } from "@/components/SectionHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDraftPlan } from "@/lib/draft-plan";
import type { Recipe, WeeklyPlan } from "@/lib/types";

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

export default function RecipesPage() {
  const router = useRouter();
  const [recipes, setRecipes] = React.useState<Recipe[]>([]);
  const [weeklyPlan, setWeeklyPlan] = React.useState<WeeklyPlan | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [search, setSearch] = React.useState("");
  const [importUrl, setImportUrl] = React.useState("");
  const [importing, setImporting] = React.useState(false);
  const [pendingRecipe, setPendingRecipe] = React.useState<Recipe | null>(null);
  const [replaceDialogOpen, setReplaceDialogOpen] = React.useState(false);

  const { draftIds, add: addDraft, clear: clearDraft } = useDraftPlan();

  const hasPlan = weeklyPlan?.items?.length === MAX_ITEMS;
  const selectedIds = hasPlan ? weeklyPlan?.items.map((item) => item.recipeId) ?? [] : draftIds;

  const fetchData = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [recipesRes, planRes] = await Promise.all([
        fetch("/api/recipes"),
        fetch("/api/weekly-plan"),
      ]);
      if (!recipesRes.ok || !planRes.ok) {
        throw new Error("Failed to load recipes.");
      }
      const recipesJson = await recipesRes.json();
      const planJson = await planRes.json();
      setRecipes(recipesJson.recipes ?? []);
      setWeeklyPlan(planJson.weeklyPlan ?? null);
    } catch (err) {
      setError("Unable to load recipes right now.");
    } finally {
      setLoading(false);
    }
  }, []);

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

  const handleSelectRecipe = (recipe: Recipe) => {
    if (selectedIds.includes(recipe.id)) {
      toast.message("Recipe already selected for this week.");
      return;
    }

    if (hasPlan) {
      setPendingRecipe(recipe);
      setReplaceDialogOpen(true);
      return;
    }

    addDraft(recipe.id);
    toast.success("Added to this week.");
  };

  const handleReplaceConfirm = async (replaceId: string) => {
    if (!weeklyPlan || !pendingRecipe) {
      return;
    }
    const nextItems = weeklyPlan.items.map((item) =>
      item.recipeId === replaceId
        ? { recipeId: pendingRecipe.id, servings: item.servings }
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
      setPendingRecipe(null);
      await fetchData();
    } catch (err) {
      toast.error("Unable to update the plan.");
    }
  };

  const handleImport = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!importUrl.trim()) {
      toast.error("Paste a recipe URL first.");
      return;
    }
    try {
      setImporting(true);
      const response = await fetch("/api/recipes/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: importUrl.trim() }),
      });
      const json = await response.json();
      if (!response.ok) {
        throw new Error(json?.error?.message ?? "Import failed.");
      }
      toast.success("Recipe imported.");
      setImportUrl("");
      await fetchData();
      if (json.recipe?.id) {
        router.push(`/recipes/${json.recipe.id}`);
      }
    } catch (err) {
      toast.error("Import failed. Check the whitelist first.");
    } finally {
      setImporting(false);
    }
  };

  const filteredRecipes = recipes.filter((recipe) =>
    recipe.title.toLowerCase().includes(search.toLowerCase())
  );

  const replaceOptions = weeklyPlan?.items
    ? weeklyPlan.items
        .map((item) => {
          const recipe = recipes.find((candidate) => candidate.id === item.recipeId);
          return recipe
            ? { id: item.recipeId, title: recipe.title, subtitle: `${recipe.servings} servings` }
            : null;
        })
        .filter(Boolean)
    : [];

  return (
    <AppShell title="Recipes" subtitle="Your saved family favorites.">
      <div className="space-y-6">
        <SectionHeader
          title="Search recipes"
          subtitle="Find a dinner by name."
          actions={<Button onClick={fetchData} variant="secondary">Refresh</Button>}
        />
        <Input
          placeholder="Search recipes by title..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />

        <SectionHeader
          title="Import recipe by URL"
          subtitle="Only whitelisted domains are allowed."
        />
        <form onSubmit={handleImport} className="flex flex-col gap-2 md:flex-row">
          <Input
            placeholder="https://example.com/your-recipe"
            value={importUrl}
            onChange={(event) => setImportUrl(event.target.value)}
          />
          <Button type="submit" disabled={importing}>
            {importing ? "Importing..." : "Import"}
          </Button>
        </form>

        {loading ? <LoadingSkeleton count={4} /> : null}
        {error ? <ErrorState title="Recipes unavailable" description={error} /> : null}

        {!loading && !error && filteredRecipes.length === 0 ? (
          <EmptyState
            title="No recipes yet"
            description="Import a recipe to get started."
            action={
              <Button asChild>
                <a href="/settings/whitelist">Manage whitelist</a>
              </Button>
            }
          />
        ) : null}

        <div className="grid gap-4 md:grid-cols-2">
          {filteredRecipes.map((recipe) => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              actionLabel="Select for this week"
              secondaryActionLabel="View details"
              onAction={handleSelectRecipe}
              onSecondaryAction={() => router.push(`/recipes/${recipe.id}`)}
            />
          ))}
        </div>
      </div>

      <RecipePickerDialog
        open={replaceDialogOpen}
        onOpenChange={setReplaceDialogOpen}
        title="Replace a meal"
        description="Pick which dinner to swap out."
        options={replaceOptions as { id: string; title: string; subtitle?: string }[]}
        confirmLabel="Replace"
        onConfirm={handleReplaceConfirm}
      />
    </AppShell>
  );
}
