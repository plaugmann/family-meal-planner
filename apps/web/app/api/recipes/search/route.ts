import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError } from "@/lib/api";
import { requireHousehold } from "@/lib/auth";
import { searchArla, searchMadbanditten, searchValdemarsro } from "@/lib/recipe-scrapers/site-search";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const household = await requireHousehold();
  if (!household) {
    return jsonError("NOT_ALLOWED", "Authentication required.", 401);
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";
  const domain = searchParams.get("domain")?.trim() ?? "";
  const limitParam = searchParams.get("limit");
  const limit = limitParam ? Math.min(Math.max(Number(limitParam), 1), 50) : 20;

  if (!q) {
    return jsonError("VALIDATION_ERROR", "q is required.", 400);
  }
  try {
    const whitelist = await prisma.whitelistSite.findMany({
      where: { householdId: household.id, isActive: true },
      select: { domain: true, name: true },
    });
    const allowedDomains = new Map(whitelist.map((item) => [item.domain, item.name ?? item.domain]));

    const targets = domain ? [domain] : Array.from(allowedDomains.keys());
    const activeTargets = targets.filter((item) => allowedDomains.has(item));

    if (activeTargets.length === 0) {
      return jsonError("NOT_ALLOWED", "Domain is not whitelisted.", 403, { domain });
    }

    const perDomainLimit = Math.max(1, Math.ceil(limit / activeTargets.length));
    const resultBuckets = await Promise.all(
      activeTargets.map(async (target) => {
        if (target === "madbanditten.dk") {
          return await searchMadbanditten(q, perDomainLimit);
        }
        if (target === "valdemarsro.dk") {
          return await searchValdemarsro(q, perDomainLimit);
        }
        if (target === "arla.dk") {
          return await searchArla(q, perDomainLimit);
        }
        return [];
      })
    );

    const merged = resultBuckets.flat().slice(0, limit);
    const existing = await prisma.recipe.findMany({
      where: {
        householdId: household.id,
        sourceUrl: { in: merged.map((item) => item.url) },
      },
      select: { sourceUrl: true },
    });
    const existingSet = new Set(existing.map((item) => item.sourceUrl));

    return NextResponse.json({
      results: merged.map((item) => ({
        ...item,
        sourceName: allowedDomains.get(item.sourceDomain) ?? item.sourceDomain,
        isImported: existingSet.has(item.url),
      })),
    });
  } catch (error) {
    return jsonError("IMPORT_FAILED", "Unable to search external site.", 422, { domain });
  }
}
