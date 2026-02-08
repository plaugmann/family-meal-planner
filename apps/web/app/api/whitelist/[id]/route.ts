import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError, parseJson } from "@/lib/api";
import { requireHousehold } from "@/lib/auth";

export const runtime = "nodejs";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const household = await requireHousehold();
  if (!household) {
    return jsonError("NOT_ALLOWED", "Authentication required.", 401);
  }
  const payload = await parseJson<{ name?: string; isActive?: boolean }>(request);
  if (!payload || (payload.name === undefined && payload.isActive === undefined)) {
    return jsonError("VALIDATION_ERROR", "No updates provided.", 400);
  }

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

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const household = await requireHousehold();
  if (!household) {
    return jsonError("NOT_ALLOWED", "Authentication required.", 401);
  }

  const site = await prisma.whitelistSite.findFirst({
    where: { id: params.id, householdId: household.id },
  });

  if (!site) {
    return jsonError("NOT_FOUND", "Whitelist site not found.", 404);
  }

  await prisma.whitelistSite.delete({ where: { id: site.id } });
  return NextResponse.json({ ok: true });
}
