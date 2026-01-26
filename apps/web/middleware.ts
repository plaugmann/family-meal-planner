import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/auth-constants";

const STATIC_FILE = /\.(.*)$/;

function isPublicPath(pathname: string) {
  return (
    pathname === "/favicon.ico" ||
    pathname === "/manifest.webmanifest" ||
    pathname === "/sw.js" ||
    pathname.startsWith("/api/auth/") ||
    pathname.startsWith("/_next/") ||
    STATIC_FILE.test(pathname)
  );
}

function unauthorizedResponse(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json(
      { error: { code: "NOT_ALLOWED", message: "Authentication required." } },
      { status: 401 }
    );
  }

  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = "/login";
  loginUrl.search = "";
  return NextResponse.redirect(loginUrl);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isLogin = pathname === "/login";

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    if (isLogin) {
      return NextResponse.next();
    }
    return unauthorizedResponse(request);
  }

  let authenticated = false;
  try {
    const verifyUrl = new URL("/api/auth/me", request.url);
    const verifyResponse = await fetch(verifyUrl, {
      headers: {
        cookie: `${SESSION_COOKIE_NAME}=${token}`,
      },
    });
    if (verifyResponse.ok) {
      const data = await verifyResponse.json();
      authenticated = Boolean(data?.authenticated);
    }
  } catch {
    authenticated = false;
  }

  if (!authenticated) {
    if (isLogin) {
      return NextResponse.next();
    }
    return unauthorizedResponse(request);
  }

  if (isLogin) {
    const homeUrl = request.nextUrl.clone();
    homeUrl.pathname = "/";
    homeUrl.search = "";
    return NextResponse.redirect(homeUrl);
  }

  return NextResponse.next();
}
