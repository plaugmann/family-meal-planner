"use client";

import * as React from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import { SectionHeader } from "@/components/SectionHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { InventoryItem } from "@/lib/types";

type Location = "FRIDGE" | "PANTRY";

export default function InventoryPage() {
  const [items, setItems] = React.useState<InventoryItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [activeTab, setActiveTab] = React.useState<Location>("FRIDGE");
  const [name, setName] = React.useState("");
  const [location, setLocation] = React.useState<Location>("PANTRY");

  const fetchItems = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/inventory?location=${activeTab}&active=true`);
      if (!response.ok) {
        throw new Error("Failed to load inventory.");
      }
      const json = await response.json();
      setItems(json.items ?? []);
    } catch (err) {
      setError("Unable to load inventory.");
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  React.useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleAdd = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim()) {
      toast.error("Enter an item name.");
      return;
    }
    try {
      const response = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), location }),
      });
      if (!response.ok) {
        throw new Error("Failed to add.");
      }
      toast.success("Item added.");
      setName("");
      await fetchItems();
    } catch (err) {
      toast.error("Unable to add item.");
    }
  };

  const handleRemove = async (item: InventoryItem) => {
    try {
      const response = await fetch(`/api/inventory/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: false }),
      });
      if (!response.ok) {
        throw new Error("Failed to update.");
      }
      toast.success("Removed from inventory.");
      await fetchItems();
    } catch (err) {
      toast.error("Unable to remove item.");
    }
  };

  return (
    <AppShell title="Inventory" subtitle="Keep track of what you have.">
      <div className="space-y-6">
        <SectionHeader title="Quick add" subtitle="Presence-only. No quantities." />
        <form onSubmit={handleAdd} className="grid gap-2 md:grid-cols-[1fr_160px_120px]">
          <Input
            placeholder="Add item (e.g., olive oil)"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          <select
            className="h-10 rounded-xl border border-input bg-background px-3 text-sm"
            value={location}
            onChange={(event) => setLocation(event.target.value as Location)}
          >
            <option value="PANTRY">Pantry</option>
            <option value="FRIDGE">Fridge/Freezer</option>
          </select>
          <Button type="submit">Add</Button>
        </form>

        <SectionHeader title="Your inventory" subtitle="Tap to remove items you no longer have." />
        <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as Location)}>
          <TabsList>
            <TabsTrigger value="FRIDGE">Fridge/Freezer</TabsTrigger>
            <TabsTrigger value="PANTRY">Pantry</TabsTrigger>
          </TabsList>
          <TabsContent value="FRIDGE" className="mt-4 space-y-4">
            {loading ? <LoadingSkeleton count={3} /> : null}
            {error ? <ErrorState title="Inventory unavailable" description={error} /> : null}
            {!loading && !error && items.length === 0 ? (
              <EmptyState
                title="Fridge looks empty"
                description="Add a few essentials to start."
              />
            ) : null}
            {items.length > 0 ? (
              <Card>
                <CardContent className="space-y-3 pt-5">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between">
                      <p>{item.name}</p>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleRemove(item)}
                        aria-label={`Remove ${item.name}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ) : null}
          </TabsContent>
          <TabsContent value="PANTRY" className="mt-4 space-y-4">
            {loading ? <LoadingSkeleton count={3} /> : null}
            {error ? <ErrorState title="Inventory unavailable" description={error} /> : null}
            {!loading && !error && items.length === 0 ? (
              <EmptyState
                title="Pantry needs a few staples"
                description="Add pantry items to improve suggestions."
              />
            ) : null}
            {items.length > 0 ? (
              <Card>
                <CardContent className="space-y-3 pt-5">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between">
                      <p>{item.name}</p>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleRemove(item)}
                        aria-label={`Remove ${item.name}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ) : null}
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
