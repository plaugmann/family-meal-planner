import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateHousehold, jsonError, normalizeText, parseJson } from "@/lib/api";

export const runtime = "nodejs";

export async function GET() {
  const household = await getOrCreateHousehold();
  const sites = await prisma.whitelistSite.findMany({
    where: { householdId: household.id },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ sites });
}

export async function POST(request: Request) {
  const payload = await parseJson<{ domain?: string; name?: string }>(request);
  if (!payload?.domain) {
    return jsonError("VALIDATION_ERROR", "Domain is required.", 400);
  }

  const cleanedDomain = normalizeText(payload.domain).replace(/^www\./, "");
  if (!cleanedDomain.includes(".")) {
    return jsonError("VALIDATION_ERROR", "Domain must be valid.", 400);
  }

  const household = await getOrCreateHousehold();

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
