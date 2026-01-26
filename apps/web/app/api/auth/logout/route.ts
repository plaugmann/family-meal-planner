import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE_NAME } from "@/lib/auth-constants";
import { clearSessionCookie, getCookieValue, hashToken } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const token = getCookieValue(SESSION_COOKIE_NAME, cookieHeader);

  if (token) {
    await prisma.householdSession.deleteMany({
      where: { tokenHash: hashToken(token) },
    });
  }

  const response = NextResponse.json({ ok: true });
  clearSessionCookie(response);
  return response;
}
