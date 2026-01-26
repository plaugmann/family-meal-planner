import bcrypt from "bcryptjs";
import { createHash, randomBytes } from "crypto";
import type { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE_NAME } from "@/lib/auth-constants";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;
const SESSION_TTL_MS = SESSION_MAX_AGE_SECONDS * 1000;

export function generateSessionToken() {
  return randomBytes(32).toString("hex");
}

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function getSessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  };
}

export function setSessionCookie(response: NextResponse, token: string) {
  response.cookies.set(SESSION_COOKIE_NAME, token, getSessionCookieOptions());
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set(SESSION_COOKIE_NAME, "", {
    ...getSessionCookieOptions(),
    maxAge: 0,
  });
}

export function getCookieValue(name: string, cookieHeader: string) {
  if (!cookieHeader) {
    return null;
  }

  const parts = cookieHeader.split(";").map((part) => part.trim());
  for (const part of parts) {
    if (part.startsWith(`${name}=`)) {
      return decodeURIComponent(part.slice(name.length + 1));
    }
  }
  return null;
}

export async function getHouseholdFromToken(token: string | null) {
  if (!token) {
    return null;
  }

  const tokenHash = hashToken(token);
  const session = await prisma.householdSession.findFirst({
    where: {
      tokenHash,
      expiresAt: { gt: new Date() },
    },
    include: { household: true },
  });

  return session?.household ?? null;
}

export async function getHouseholdFromRequest(request: Request) {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const token = getCookieValue(SESSION_COOKIE_NAME, cookieHeader);
  return getHouseholdFromToken(token);
}

export async function requireHousehold() {
  const token = cookies().get(SESSION_COOKIE_NAME)?.value ?? null;
  return getHouseholdFromToken(token);
}

export function isValidPin(pin: string) {
  return /^\d{4,8}$/.test(pin);
}

export async function verifyPin(pin: string, hash: string) {
  return bcrypt.compare(pin, hash);
}

export function getSessionExpiry() {
  return new Date(Date.now() + SESSION_TTL_MS);
}
