import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError, normalizeText, parseJson } from "@/lib/api";
import { requireHousehold } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET() {
  const household = await requireHousehold();
  if (!household) {
    return jsonError("NOT_ALLOWED", "Authentication required.", 401);
  }
  const sites = await prisma.whitelistSite.findMany({
    where: { householdId: household.id },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ sites });
}

export async function POST(request: Request) {
  const household = await requireHousehold();
  if (!household) {
    return jsonError("NOT_ALLOWED", "Authentication required.", 401);
  }
  const payload = await parseJson<{ domain?: string; name?: string }>(request);
  if (!payload?.domain) {
    return jsonError("VALIDATION_ERROR", "Domain is required.", 400);
  }

  let cleanedDomain = normalizeText(payload.domain).replace(/\s+/g, "");
  if (cleanedDomain.includes("://")) {
    try {
      cleanedDomain = new URL(cleanedDomain).hostname;
    } catch {
      return jsonError("VALIDATION_ERROR", "Domain must be valid.", 400);
    }
  } else {
    cleanedDomain = cleanedDomain.split("/")[0] ?? cleanedDomain;
  }

  cleanedDomain = cleanedDomain.replace(/^www\./, "");
  if (!cleanedDomain.includes(".")) {
    return jsonError("VALIDATION_ERROR", "Domain must be valid.", 400);
  }

  try {
    const site = await prisma.whitelistSite.create({
      data: {
        householdId: household.id,
        domain: cleanedDomain,
        name: payload.name?.trim() || null,
        isActive: true,
      },
    });

    return NextResponse.json({ site }, { status: 201 });
  } catch (error) {
    return jsonError("CONFLICT", "Domain already exists for this household.", 409, {
      domain: cleanedDomain,
    });
  }
}
