import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateHousehold, jsonError, parseJson } from "@/lib/api";

export const runtime = "nodejs";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const payload = await parseJson<{ name?: string; isActive?: boolean }>(request);
  if (!payload || (payload.name === undefined && payload.isActive === undefined)) {
    return jsonError("VALIDATION_ERROR", "No updates provided.", 400);
  }

  const household = await getOrCreateHousehold();
  const site = await prisma.whitelistSite.findFirst({
    where: { id: params.id, householdId: household.id },
  });

  if (!site) {
    return jsonError("NOT_FOUND", "Whitelist site not found.", 404);
  }

  const updated = await prisma.whitelistSite.update({
    where: { id: site.id },
    data: {
      name: payload.name?.trim() ?? undefined,
      isActive: payload.isActive ?? undefined,
    },
  });

  return NextResponse.json({ site: updated });
}
