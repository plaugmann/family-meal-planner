"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";

const LoadingContext = React.createContext<{
  isLoading: boolean;
  showLoading: () => void;
  hideLoading: () => void;
}>({
  isLoading: false,
  showLoading: () => {},
  hideLoading: () => {},
});

export function LoadingProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = React.useState(false);

  const showLoading = React.useCallback(() => {
    setIsLoading(true);
  }, []);

  const hideLoading = React.useCallback(() => {
    setIsLoading(false);
  }, []);

  return (
    <LoadingContext.Provider value={{ isLoading, showLoading, hideLoading }}>
      {children}
      {isLoading ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading...</p>
          </div>
        </div>
      ) : null}
    </LoadingContext.Provider>
  );
}

export function useLoading() {
  return React.useContext(LoadingContext);
}