"use client";

import * as React from "react";
import { Plus, Trash2, ChevronDown, ChevronUp, Loader2, ExternalLink, FileDown, Baby } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { EmptyState } from "@/components/EmptyState";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { generateRecipePdf, generateAllRecipesPdf, generateImagePdf } from "@/lib/pdf";
import type { WeeklyPlan, WeeklyPlanRecipe, ParsedRecipe } from "@/lib/types";

export default function ThisWeekPage() {
  const [plan, setPlan] = React.useState<WeeklyPlan | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [urlInput, setUrlInput] = React.useState("");
  const [parsing, setParsing] = React.useState(false);
  const [expandedId, setExpandedId] = React.useState<string | null>(null);
  const [kidsLoading, setKidsLoading] = React.useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = React.useState<string | null>(null);

  const fetchPlan = React.useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/weekly-plan");
      const json = await res.json();
      setPlan(json.weeklyPlan ?? null);
    } catch {
      toast.error("Kunne ikke hente ugeplan.");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchPlan();
  }, [fetchPlan]);

  const recipes = plan?.recipes ?? [];

  const savePlan = async (updatedRecipes: Array<Omit<WeeklyPlanRecipe, "id" | "position">>) => {
    try {
      const res = await fetch("/api/weekly-plan", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipes: updatedRecipes }),
      });
      if (!res.ok) throw new Error();
      const json = await res.json();
      setPlan(json.weeklyPlan);
    } catch {
      toast.error("Kunne ikke gemme ugeplanen.");
    }
  };

  const handleAddRecipe = async () => {
    const url = urlInput.trim();
    if (!url) return;

    try {
      new URL(url);
    } catch {
      toast.error("Ugyldig URL.");
      return;
    }

    setParsing(true);
    try {
      const res = await fetch("/api/parse-recipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json?.error?.message ?? "Kunne ikke læse opskriften.");
      }

      const json = await res.json();
      const parsed: ParsedRecipe = json.recipe;

      const current = recipes.map((r) => ({
        title: r.title,
        imageUrl: r.imageUrl,
        sourceUrl: r.sourceUrl,
        servings: r.servings,
        ingredients: r.ingredients,
        directions: r.directions,
      }));

      await savePlan([
        ...current,
        {
          title: parsed.title,
          imageUrl: parsed.imageUrl,
          sourceUrl: parsed.sourceUrl,
          servings: parsed.servings,
          ingredients: parsed.ingredients,
          directions: parsed.directions,
        },
      ]);

      setUrlInput("");
      toast.success(`"${parsed.title}" tilføjet!`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Kunne ikke læse opskriften.");
    } finally {
      setParsing(false);
    }
  };

  const handleRemoveRecipe = async (index: number) => {
    const updated = recipes
      .filter((_, i) => i !== index)
      .map((r) => ({
        title: r.title,
        imageUrl: r.imageUrl,
        sourceUrl: r.sourceUrl,
        servings: r.servings,
        ingredients: r.ingredients,
        directions: r.directions,
      }));

    await savePlan(updated);
    toast.success("Opskrift fjernet.");
  };

  const handleDownloadRecipe = (recipe: WeeklyPlanRecipe) => {
    try {
      generateRecipePdf(recipe);
      toast.success("PDF downloadet.");
    } catch {
      toast.error("Kunne ikke generere PDF.");
    }
  };

  const handleDownloadAllRecipes = () => {
    if (recipes.length === 0) return;
    try {
      generateAllRecipesPdf(recipes);
      toast.success("PDF downloadet.");
    } catch {
      toast.error("Kunne ikke generere PDF.");
    }
  };

  const handleKidsRecipe = async (recipe: WeeklyPlanRecipe) => {
    setKidsLoading(recipe.id);
    try {
      const res = await fetch("/api/kids-recipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: recipe.title,
          ingredients: recipe.ingredients,
          directions: recipe.directions,
          servings: recipe.servings,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        const msg = json?.error?.message ?? "Kunne ikke generere børneopskrift.";
        console.error("Kids recipe API error:", json);
        throw new Error(msg);
      }

      if (!json.imageUrl) {
        console.error("Kids recipe response missing imageUrl:", json);
        throw new Error("Intet billede returneret.");
      }

      await generateImagePdf(
        json.imageUrl,
        `${recipe.title.replace(/[^a-zA-Z0-9æøåÆØÅ ]/g, "").trim()} - Børneopskrift.pdf`
      );
      toast.success("Børneopskrift PDF downloadet.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Kunne ikke generere børneopskrift.";
      console.error("Kids recipe error:", err);
      toast.error(msg);
    } finally {
      setKidsLoading(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !parsing) {
      handleAddRecipe();
    }
  };

  return (
    <AppShell
      title="Ugeplan"
      subtitle={`${recipes.length} opskrift${recipes.length !== 1 ? "er" : ""} denne uge`}
      actions={
        recipes.length > 0 ? (
          <Button variant="outline" size="sm" onClick={handleDownloadAllRecipes}>
            <FileDown className="mr-2 h-4 w-4" />
            PDF alle
          </Button>
        ) : undefined
      }
    >
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-5">
            <p className="mb-3 text-sm font-medium">Tilføj opskrift fra URL</p>
            <div className="flex gap-2">
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Indsæt link til opskrift..."
                className="flex-1 rounded-lg border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                disabled={parsing}
              />
              <Button onClick={handleAddRecipe} disabled={parsing || !urlInput.trim()}>
                {parsing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              </Button>
            </div>
          </CardContent>
        </Card>

        {loading && <LoadingSkeleton count={3} />}

        {!loading && recipes.length === 0 && (
          <EmptyState
            title="Ingen opskrifter endnu"
            description="Indsæt et link til en opskrift ovenfor for at starte din ugeplan."
            icon={<Plus className="h-6 w-6" />}
          />
        )}

        <div className="space-y-4">
          {recipes.map((recipe, index) => {
            const isExpanded = expandedId === recipe.id;
            return (
              <Card key={recipe.id}>
                <CardContent className="pt-5">
                  <div className="flex items-start gap-3">
                    {recipe.imageUrl && (
                      <img
                        src={recipe.imageUrl}
                        alt={recipe.title}
                        className="h-16 w-16 rounded-lg object-cover"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">{recipe.title}</h3>
                      <p className="text-xs text-muted-foreground">{recipe.servings} portioner</p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setExpandedId(isExpanded ? null : recipe.id)}
                        title={isExpanded ? "Skjul" : "Vis detaljer"}
                      >
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRemoveRecipe(index)}
                        title="Fjern"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="mt-4 space-y-4">
                      <div>
                        <h4 className="text-sm font-semibold mb-2">Ingredienser</h4>
                        <ul className="list-disc pl-5 space-y-1 text-sm">
                          {recipe.ingredients.map((ing, i) => (
                            <li key={i}>{ing}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold mb-2">Fremgangsmåde</h4>
                        <ol className="list-decimal pl-5 space-y-1 text-sm">
                          {recipe.directions.map((dir, i) => (
                            <li key={i}>{dir}</li>
                          ))}
                        </ol>
                      </div>
                      <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
                        <Button size="sm" variant="outline" asChild>
                          <a href={recipe.sourceUrl} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="mr-2 h-3 w-3" />
                            Original
                          </a>
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleDownloadRecipe(recipe)}>
                          <FileDown className="mr-2 h-3 w-3" />
                          PDF
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleKidsRecipe(recipe)}
                          disabled={kidsLoading === recipe.id}
                        >
                          {kidsLoading === recipe.id ? (
                            <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                          ) : (
                            <Baby className="mr-2 h-3 w-3" />
                          )}
                          Børne-PDF
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
