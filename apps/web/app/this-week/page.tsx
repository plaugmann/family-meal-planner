"use client";

import * as React from "react";
import { Plus, Trash2, ChevronDown, ChevronUp, Loader2, ExternalLink, Printer, Baby } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { EmptyState } from "@/components/EmptyState";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { WeeklyPlan, WeeklyPlanRecipe, ParsedRecipe } from "@/lib/types";

export default function ThisWeekPage() {
  const [plan, setPlan] = React.useState<WeeklyPlan | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [urlInput, setUrlInput] = React.useState("");
  const [parsing, setParsing] = React.useState(false);
  const [expandedId, setExpandedId] = React.useState<string | null>(null);
  const [kidsLoading, setKidsLoading] = React.useState<string | null>(null);

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

  const handlePrintRecipe = (recipe: WeeklyPlanRecipe) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="da">
      <head>
        <meta charset="utf-8" />
        <title>${recipe.title}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; font-size: 12px; }
          h1 { font-size: 20px; margin-bottom: 8px; }
          .meta { color: #666; margin-bottom: 12px; font-size: 11px; }
          .columns { display: flex; gap: 20px; }
          .col-ingredients { flex: 0 0 35%; }
          .col-directions { flex: 1; }
          h2 { font-size: 14px; margin-bottom: 6px; border-bottom: 1px solid #ddd; padding-bottom: 4px; }
          ul, ol { padding-left: 18px; }
          li { margin-bottom: 3px; line-height: 1.4; }
          img { max-width: 200px; max-height: 150px; object-fit: cover; border-radius: 8px; float: right; margin: 0 0 10px 10px; }
          @media print { body { padding: 10px; } }
        </style>
      </head>
      <body>
        ${recipe.imageUrl ? `<img src="${recipe.imageUrl}" alt="${recipe.title}" />` : ""}
        <h1>${recipe.title}</h1>
        <p class="meta">${recipe.servings} portioner &middot; ${recipe.sourceUrl}</p>
        <div class="columns">
          <div class="col-ingredients">
            <h2>Ingredienser</h2>
            <ul>${recipe.ingredients.map((i) => `<li>${i}</li>`).join("")}</ul>
          </div>
          <div class="col-directions">
            <h2>Fremgangsmåde</h2>
            <ol>${recipe.directions.map((d) => `<li>${d}</li>`).join("")}</ol>
          </div>
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const handlePrintAllRecipes = () => {
    if (recipes.length === 0) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const recipesHtml = recipes.map((recipe) => `
      <div class="recipe-page">
        ${recipe.imageUrl ? `<img src="${recipe.imageUrl}" alt="${recipe.title}" />` : ""}
        <h1>${recipe.title}</h1>
        <p class="meta">${recipe.servings} portioner &middot; ${recipe.sourceUrl}</p>
        <div class="columns">
          <div class="col-ingredients">
            <h2>Ingredienser</h2>
            <ul>${recipe.ingredients.map((i) => `<li>${i}</li>`).join("")}</ul>
          </div>
          <div class="col-directions">
            <h2>Fremgangsmåde</h2>
            <ol>${recipe.directions.map((d) => `<li>${d}</li>`).join("")}</ol>
          </div>
        </div>
      </div>
    `).join("");

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="da">
      <head>
        <meta charset="utf-8" />
        <title>Ugens opskrifter</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; font-size: 12px; }
          .recipe-page { page-break-after: always; margin-bottom: 30px; }
          .recipe-page:last-child { page-break-after: auto; }
          h1 { font-size: 20px; margin-bottom: 8px; }
          .meta { color: #666; margin-bottom: 12px; font-size: 11px; }
          .columns { display: flex; gap: 20px; }
          .col-ingredients { flex: 0 0 35%; }
          .col-directions { flex: 1; }
          h2 { font-size: 14px; margin-bottom: 6px; border-bottom: 1px solid #ddd; padding-bottom: 4px; }
          ul, ol { padding-left: 18px; }
          li { margin-bottom: 3px; line-height: 1.4; }
          img { max-width: 200px; max-height: 150px; object-fit: cover; border-radius: 8px; float: right; margin: 0 0 10px 10px; }
        </style>
      </head>
      <body>${recipesHtml}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
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

      if (!res.ok) throw new Error("Kunne ikke generere børneopskrift.");

      const json = await res.json();
      const printWindow = window.open("", "_blank");
      if (!printWindow) return;

      printWindow.document.write(`
        <!DOCTYPE html>
        <html lang="da">
        <head>
          <meta charset="utf-8" />
          <title>${recipe.title} - Børneopskrift</title>
        </head>
        <body>${json.html}</body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    } catch {
      toast.error("Kunne ikke generere børneopskrift.");
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
          <Button variant="outline" size="sm" onClick={handlePrintAllRecipes}>
            <Printer className="mr-2 h-4 w-4" />
            Print alle
          </Button>
        ) : undefined
      }
    >
      <div className="space-y-6">
        {/* URL Input */}
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

        {/* Recipe list */}
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
                        <Button size="sm" variant="outline" onClick={() => handlePrintRecipe(recipe)}>
                          <Printer className="mr-2 h-3 w-3" />
                          Print
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
                          Børneopskrift
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
