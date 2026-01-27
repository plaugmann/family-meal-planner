import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError, parseJson } from "@/lib/api";
import {
  generateSessionToken,
  getSessionExpiry,
  hashToken,
  isValidPin,
  setSessionCookie,
  verifyPin,
} from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const payload = await parseJson<{ code?: string; pin?: string }>(request);
  if (!payload) {
    return jsonError("VALIDATION_ERROR", "Invalid JSON body.", 400);
  }

  const code = payload.code?.trim().toLowerCase() ?? "";
  const pin = payload.pin?.trim() ?? "";

  if (!code || !isValidPin(pin)) {
    return jsonError("VALIDATION_ERROR", "Invalid household code or PIN.", 400);
  }

  const household = await prisma.household.findFirst({
    where: { code: { equals: code } },
  });

  if (!household) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const pinOk = await verifyPin(pin, household.pinHash);
  if (!pinOk) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const token = generateSessionToken();
  const expiresAt = getSessionExpiry();

  await prisma.householdSession.create({
    data: {
      householdId: household.id,
      tokenHash: hashToken(token),
      expiresAt,
      lastUsedAt: new Date(),
      userAgent: request.headers.get("user-agent") ?? undefined,
    },
  });

  const response = NextResponse.json({
    ok: true,
    household: { id: household.id, name: household.name, code: household.code },
  });

  setSessionCookie(response, token);
  return response;
}
