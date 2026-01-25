"use client";

import * as React from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import { RecipeCard } from "@/components/RecipeCard";
import { RecipePickerDialog } from "@/components/RecipePickerDialog";
import { SectionHeader } from "@/components/SectionHeader";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

function FilterToggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: "on" | "off";
  onChange: (value: "on" | "off") => void;
}) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-2xl border border-border bg-card px-3 py-2">
      <span className="text-sm font-medium">{label}</span>
      <Tabs value={value} onValueChange={(val) => onChange(val as "on" | "off")}>
        <TabsList className="h-9">
          <TabsTrigger value="on">On</TabsTrigger>
          <TabsTrigger value="off">Off</TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
}

export default function DiscoverPage() {
  const [recipes, setRecipes] = React.useState<Recipe[]>([]);
  const [weeklyPlan, setWeeklyPlan] = React.useState<WeeklyPlan | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [pendingRecipe, setPendingRecipe] = React.useState<Recipe | null>(null);
  const [replaceDialogOpen, setReplaceDialogOpen] = React.useState(false);

  const [favoritesInfluence, setFavoritesInfluence] = React.useState<"on" | "off">("off");
  const [seasonal, setSeasonal] = React.useState<"on" | "off">("off");
  const [useWhatWeHave, setUseWhatWeHave] = React.useState<"on" | "off">("off");
  const [familyFriendly, setFamilyFriendly] = React.useState<"on" | "off">("on");

  const { draftIds, add: addDraft, clear: clearDraft } = useDraftPlan();

  const hasPlan = weeklyPlan?.items?.length === MAX_ITEMS;
  const selectedIds = hasPlan ? weeklyPlan?.items.map((item) => item.recipeId) ?? [] : draftIds;

  const fetchData = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (familyFriendly === "on") {
        params.set("familyFriendly", "true");
      }
      if (favoritesInfluence === "on") {
        params.set("favorites", "true");
      }
      const [recipesRes, planRes] = await Promise.all([
        fetch(`/api/recipes?${params.toString()}`),
        fetch("/api/weekly-plan"),
      ]);
      if (!recipesRes.ok || !planRes.ok) {
        throw new Error("Failed to load.");
      }
      const recipesJson = await recipesRes.json();
      const planJson = await planRes.json();
      setRecipes(recipesJson.recipes ?? []);
      setWeeklyPlan(planJson.weeklyPlan ?? null);
    } catch (err) {
      setError("Unable to load suggestions right now.");
    } finally {
      setLoading(false);
    }
  }, [familyFriendly, favoritesInfluence]);

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

  const suggestionList = React.useMemo(() => {
    const scored = recipes.map((recipe) => {
      let score = 0;
      if (favoritesInfluence === "on" && recipe.isFavorite) {
        score += 2;
      }
      if (familyFriendly === "on" && recipe.isFamilyFriendly) {
        score += 1;
      }
      if (seasonal === "on") {
        score += 0;
      }
      if (useWhatWeHave === "on") {
        score += 0;
      }
      return { recipe, score };
    });
    return scored.sort((a, b) => b.score - a.score).map((item) => item.recipe);
  }, [recipes, favoritesInfluence, familyFriendly, seasonal, useWhatWeHave]);

  return (
    <AppShell
      title="Discover"
      subtitle="Fresh ideas with a family-friendly lean."
    >
      <div className="space-y-6">
        <SectionHeader
          title="Filters"
          subtitle="Use toggles to influence the suggestion mix."
          actions={
            <Button variant="secondary" onClick={fetchData}>
              Refresh
            </Button>
          }
        />

        <div className="grid gap-3 md:grid-cols-2">
          <FilterToggle
            label="Favorites influence"
            value={favoritesInfluence}
            onChange={setFavoritesInfluence}
          />
          <FilterToggle label="Seasonal" value={seasonal} onChange={setSeasonal} />
          <FilterToggle
            label="Use what we have"
            value={useWhatWeHave}
            onChange={setUseWhatWeHave}
          />
          <FilterToggle
            label="Family-friendly"
            value={familyFriendly}
            onChange={setFamilyFriendly}
          />
        </div>

        {loading ? <LoadingSkeleton count={4} /> : null}
        {error ? <ErrorState title="No suggestions yet" description={error} /> : null}

        {!loading && !error && suggestionList.length === 0 ? (
          <EmptyState
            title="No recipes yet"
            description="Import a few recipes to unlock personalized suggestions."
            action={
              <Button asChild>
                <a href="/recipes">Go to recipes</a>
              </Button>
            }
          />
        ) : null}

        <div className="grid gap-4 md:grid-cols-2">
          {suggestionList.map((recipe) => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              actionLabel="Select for this week"
              onAction={handleSelectRecipe}
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
