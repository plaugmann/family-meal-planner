"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const router = useRouter();
  const [code, setCode] = React.useState("");
  const [pin, setPin] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, pin }),
      });

      if (response.ok) {
        router.push("/");
        router.refresh();
        return;
      }

      if (response.status === 401) {
        setError("Invalid household code or PIN.");
      } else {
        setError("Unable to sign in. Please try again.");
      }
    } catch (err) {
      setError("Unable to sign in. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-background min-h-screen text-foreground">
      <div className="mx-auto flex min-h-screen w-full max-w-md items-center px-4">
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="font-display text-2xl">Family Meal Planner</CardTitle>
            <CardDescription>Sign in to plan this week's dinners.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="household-code">
                  Household code
                </label>
                <Input
                  id="household-code"
                  autoComplete="username"
                  value={code}
                  onChange={(event) => setCode(event.target.value)}
                  placeholder="family"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="pin">
                  PIN
                </label>
                <Input
                  id="pin"
                  type="password"
                  inputMode="numeric"
                  autoComplete="current-password"
                  value={pin}
                  onChange={(event) => setPin(event.target.value)}
                  placeholder="4-8 digits"
                />
              </div>
              {error ? <p className="text-sm text-destructive">{error}</p> : null}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Signing in..." : "Sign in"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
