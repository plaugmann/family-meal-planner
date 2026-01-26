import { NextResponse } from "next/server";
import { getHouseholdFromRequest } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const household = await getHouseholdFromRequest(request);
  if (!household) {
    return NextResponse.json({ authenticated: false });
  }

  return NextResponse.json({
    authenticated: true,
    household: { id: household.id, name: household.name, code: household.code },
  });
}
