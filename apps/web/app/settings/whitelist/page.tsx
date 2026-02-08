"use client";

import * as React from "react";
import { toast } from "sonner";
import { Globe2 } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import { SectionHeader } from "@/components/SectionHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { WhitelistSite } from "@/lib/types";

export default function WhitelistPage() {
  const [sites, setSites] = React.useState<WhitelistSite[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [domain, setDomain] = React.useState("");
  const [name, setName] = React.useState("");
  const [confirmSite, setConfirmSite] = React.useState<WhitelistSite | null>(null);
  const [confirmAction, setConfirmAction] = React.useState<"disable" | "remove">("disable");

  const fetchSites = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/whitelist");
      if (!response.ok) {
        throw new Error("Failed to load.");
      }
      const json = await response.json();
      setSites(json.sites ?? []);
    } catch (err) {
      setError("Unable to load whitelist.");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchSites();
  }, [fetchSites]);

  const normalizeDomainInput = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) {
      return "";
    }
    const normalized = trimmed.toLowerCase();
    if (normalized.includes("://")) {
      try {
        const url = new URL(normalized);
        return url.hostname.replace(/^www\./, "");
      } catch {
        return trimmed;
      }
    }
    return normalized.split("/")[0]?.replace(/^www\./, "") ?? normalized;
  };

  const handleAdd = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const cleanedDomain = normalizeDomainInput(domain);
    if (!cleanedDomain) {
      toast.error("Domain is required.");
      return;
    }
    try {
      const response = await fetch("/api/whitelist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: cleanedDomain, name: name.trim() || undefined }),
      });
      const json = await response.json();
      if (!response.ok) {
        throw new Error(json?.error?.message ?? "Unable to add domain.");
      }
      toast.success("Domain added.");
      setDomain("");
      setName("");
      await fetchSites();
    } catch (err) {
      toast.error("Unable to add that domain.");
    }
  };

  const handleDisable = async () => {
    if (!confirmSite) {
      return;
    }
    try {
      const response = await fetch(`/api/whitelist/${confirmSite.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: false }),
      });
      if (!response.ok) {
        throw new Error("Failed to update.");
      }
      toast.success("Domain disabled.");
      setConfirmSite(null);
      await fetchSites();
    } catch (err) {
      toast.error("Unable to update domain.");
    }
  };

  const handleRemove = async () => {
    if (!confirmSite) {
      return;
    }
    try {
      const response = await fetch(`/api/whitelist/${confirmSite.id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Failed to delete.");
      }
      toast.success("Domain removed.");
      setConfirmSite(null);
      await fetchSites();
    } catch (err) {
      toast.error("Unable to remove domain.");
    }
  };

  return (
    <AppShell title="Whitelist" subtitle="Trusted recipe sources only.">
      <div className="space-y-6">
        <SectionHeader title="Add a site" subtitle="Only whitelisted domains can be imported." />
        <form onSubmit={handleAdd} className="grid gap-2 md:grid-cols-[1fr_1fr_140px]">
          <Input
            placeholder="domain.com"
            value={domain}
            onChange={(event) => setDomain(event.target.value)}
            onBlur={() => setDomain((current) => normalizeDomainInput(current))}
          />
          <Input
            placeholder="Optional name"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          <Button type="submit">Add</Button>
        </form>

        <SectionHeader title="Current whitelist" subtitle="Enable or disable sites as needed." />

        {loading ? <LoadingSkeleton count={2} /> : null}
        {error ? <ErrorState title="Whitelist unavailable" description={error} /> : null}

        {!loading && !error && sites.length === 0 ? (
          <EmptyState
            title="No domains yet"
            description="Add your favorite recipe sites to start importing."
            icon={<Globe2 className="h-6 w-6" />}
          />
        ) : null}

        <div className="grid gap-4 md:grid-cols-2">
          {sites.map((site) => (
            <Card key={site.id}>
              <CardContent className="space-y-2 pt-5">
                <p className="font-medium">{site.domain}</p>
                <p className="text-sm text-muted-foreground">
                  {site.name ?? "Unnamed site"}
                </p>
                <div className="flex items-center justify-between pt-2">
                  <span
                    className={`text-xs font-semibold ${
                      site.isActive ? "text-emerald-600" : "text-muted-foreground"
                    }`}
                  >
                    {site.isActive ? "Active" : "Disabled"}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setConfirmAction("disable");
                      setConfirmSite(site);
                    }}
                    disabled={!site.isActive}
                  >
                    Disable
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => {
                      setConfirmAction("remove");
                      setConfirmSite(site);
                    }}
                  >
                    Remove
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Dialog open={!!confirmSite} onOpenChange={(open) => !open && setConfirmSite(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirmAction === "remove" ? "Remove domain?" : "Disable domain?"}
            </DialogTitle>
            <DialogDescription>
              {confirmAction === "remove"
                ? `This will delete ${confirmSite?.domain} from your whitelist.`
                : `Imports and discovery will be blocked for ${confirmSite?.domain}.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setConfirmSite(null)}>
              Cancel
            </Button>
            {confirmAction === "remove" ? (
              <Button variant="destructive" onClick={handleRemove}>
                Remove
              </Button>
            ) : (
              <Button variant="destructive" onClick={handleDisable}>
                Disable
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
