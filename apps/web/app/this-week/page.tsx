"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarCheck, ListChecks } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import { RecipeCard } from "@/components/RecipeCard";
import { RecipePickerDialog } from "@/components/RecipePickerDialog";
import { SectionHeader } from "@/components/SectionHeader";
import { Button } from "@/components/ui/button";
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

export default function ThisWeekPage() {
  const [weeklyPlan, setWeeklyPlan] = React.useState<WeeklyPlan | null>(null);
  const [recipes, setRecipes] = React.useState<Recipe[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [replaceTarget, setReplaceTarget] = React.useState<string | null>(null);
  const [replaceDialogOpen, setReplaceDialogOpen] = React.useState(false);
  const { draftIds, remove: removeDraft, clear: clearDraft } = useDraftPlan();
  const router = useRouter();

  const hasPlan = weeklyPlan?.items?.length === MAX_ITEMS;
  const selectedIds = hasPlan ? weeklyPlan?.items.map((item) => item.recipeId) ?? [] : draftIds;
  const selectedRecipes = recipes.filter((recipe) => selectedIds.includes(recipe.id));
  const progressLabel = `${selectedIds.length}/${MAX_ITEMS} dinners selected`;

  const fetchData = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [planRes, recipesRes] = await Promise.all([
        fetch("/api/weekly-plan"),
        fetch("/api/recipes"),
      ]);

      if (!planRes.ok || !recipesRes.ok) {
        throw new Error("Failed to load weekly plan data.");
      }

      const planJson = await planRes.json();
      const recipesJson = await recipesRes.json();
      setWeeklyPlan(planJson.weeklyPlan ?? null);
      setRecipes(recipesJson.recipes ?? []);
    } catch (err) {
      setError("We could not load your weekly plan yet.");
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
          throw new Error("Failed to save weekly plan.");
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

  const handleReplaceConfirm = async (replacementId: string) => {
    if (!weeklyPlan || !replaceTarget) {
      return;
    }
    const nextItems = weeklyPlan.items.map((item) =>
      item.recipeId === replaceTarget ? { recipeId: replacementId, servings: item.servings } : item
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
      setReplaceTarget(null);
      await fetchData();
    } catch (err) {
      toast.error("Unable to update the plan.");
    }
  };

  const replaceOptions = recipes
    .filter((recipe) => !selectedIds.includes(recipe.id) || recipe.id === replaceTarget)
    .map((recipe) => ({
      id: recipe.id,
      title: recipe.title,
      subtitle: `${recipe.servings} servings`,
    }));

  return (
    <AppShell title="This Week" subtitle={progressLabel}>
      <div className="space-y-6">
        <SectionHeader
          title="Your three dinners"
          subtitle="Plan exactly three family-friendly meals for the week."
          actions={
            <div className="flex flex-wrap gap-2">
              <Button asChild>
                <Link href="/discover">Get suggestions</Link>
              </Button>
              <Button variant="secondary" asChild>
                <Link href="/recipes">Add from recipes</Link>
              </Button>
              <Button variant="outline" disabled={!hasPlan} onClick={() => hasPlan && router.push("/shopping")}>
                View shopping list
              </Button>
            </div>
          }
        />

        {loading ? <LoadingSkeleton count={3} /> : null}
        {error ? <ErrorState title="Weekly plan unavailable" description={error} /> : null}

        {!loading && !error && selectedRecipes.length === 0 ? (
          <EmptyState
            title="Start with three favorites"
            description="Pick three dinner ideas to kick off your week."
            icon={<CalendarCheck className="h-6 w-6" />}
            action={
              <Button asChild>
                <Link href="/discover">Browse suggestions</Link>
              </Button>
            }
          />
        ) : null}

        <div className="grid gap-4 md:grid-cols-2">
          {selectedRecipes.map((recipe) => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              actionLabel="Remove"
              secondaryActionLabel="View recipe"
              onAction={() => {
                if (!hasPlan) {
                  removeDraft(recipe.id);
                  return;
                }
                setReplaceTarget(recipe.id);
                setReplaceDialogOpen(true);
              }}
              onSecondaryAction={() => router.push(`/recipes/${recipe.id}`)}
            />
          ))}
        </div>

        {!hasPlan ? (
          <div className="rounded-2xl border border-dashed border-border bg-card/70 p-4 text-sm text-muted-foreground">
            When you reach 3 recipes, your weekly plan is saved automatically.
          </div>
        ) : null}

        {hasPlan ? (
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent text-foreground">
                <ListChecks className="h-6 w-6" />
              </div>
              <div>
                <p className="font-display text-lg font-semibold">Plan complete</p>
                <p className="text-sm text-muted-foreground">
                  Head to Shopping to generate your list.
                </p>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <RecipePickerDialog
        open={replaceDialogOpen}
        onOpenChange={setReplaceDialogOpen}
        title="Replace a meal"
        description="Pick a recipe to swap into this week."
        options={replaceOptions}
        confirmLabel="Replace"
        onConfirm={handleReplaceConfirm}
      />
    </AppShell>
  );
}
