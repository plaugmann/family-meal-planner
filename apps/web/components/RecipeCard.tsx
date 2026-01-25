import * as React from "react";
import { Heart } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Recipe } from "@/lib/types";

type RecipeCardProps = {
  recipe: Recipe;
  actionLabel?: string;
  secondaryActionLabel?: string;
  onAction?: (recipe: Recipe) => void;
  onSecondaryAction?: (recipe: Recipe) => void;
  className?: string;
};

export function RecipeCard({
  recipe,
  actionLabel,
  secondaryActionLabel,
  onAction,
  onSecondaryAction,
  className,
}: RecipeCardProps) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <div className="relative h-40 w-full overflow-hidden">
        <img
          src={recipe.imageUrl ?? "/icon.svg"}
          alt={recipe.title}
          className="h-full w-full object-cover"
          loading="lazy"
        />
        {recipe.isFavorite ? (
          <div className="absolute right-3 top-3 rounded-full bg-white/90 p-1 text-rose-500 shadow">
            <Heart className="h-4 w-4 fill-rose-500" />
          </div>
        ) : null}
      </div>
      <CardContent className="space-y-3 pt-4">
        <div>
          <p className="font-display text-lg font-semibold">{recipe.title}</p>
          <p className="text-sm text-muted-foreground">{recipe.servings} servings</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {recipe.isFamilyFriendly ? <Badge variant="secondary">Family-friendly</Badge> : null}
          {recipe.sourceDomain ? <Badge variant="outline">{recipe.sourceDomain}</Badge> : null}
        </div>
      </CardContent>
      {(actionLabel || secondaryActionLabel) && (
        <CardFooter className="gap-2">
          {secondaryActionLabel ? (
            <Button variant="ghost" className="w-full" onClick={() => onSecondaryAction?.(recipe)}>
              {secondaryActionLabel}
            </Button>
          ) : null}
          {actionLabel ? (
            <Button className="w-full" onClick={() => onAction?.(recipe)}>
              {actionLabel}
            </Button>
          ) : null}
        </CardFooter>
      )}
    </Card>
  );
}
