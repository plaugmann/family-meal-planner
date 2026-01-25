"use client";

import * as React from "react";

const STORAGE_KEY = "fmp-weekly-plan-draft";

export function useDraftPlan() {
  const [draftIds, setDraftIds] = React.useState<string[]>([]);

  React.useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return;
    }
    try {
      const parsed = JSON.parse(raw) as string[];
      if (Array.isArray(parsed)) {
        setDraftIds(parsed);
      }
    } catch {
      // Ignore invalid storage state.
    }
  }, []);

  const persist = React.useCallback((next: string[]) => {
    setDraftIds(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    }
  }, []);

  const add = React.useCallback(
    (recipeId: string) => {
      if (draftIds.includes(recipeId)) {
        return;
      }
      persist([...draftIds, recipeId].slice(0, 3));
    },
    [draftIds, persist]
  );

  const remove = React.useCallback(
    (recipeId: string) => {
      persist(draftIds.filter((id) => id !== recipeId));
    },
    [draftIds, persist]
  );

  const clear = React.useCallback(() => {
    persist([]);
  }, [persist]);

  return {
    draftIds,
    add,
    remove,
    clear,
    setDraftIds: persist,
  };
}
