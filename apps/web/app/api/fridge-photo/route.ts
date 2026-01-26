import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api";
import { requireHousehold } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!(await requireHousehold())) {
    return jsonError("NOT_ALLOWED", "Authentication required.", 401);
  }
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.includes("multipart/form-data")) {
    return jsonError("VALIDATION_ERROR", "Expected multipart form-data.", 415);
  }

  const formData = await request.formData();
  const photo = formData.get("photo");

  if (!photo || typeof photo === "string") {
    return jsonError("VALIDATION_ERROR", "Photo file is required.", 415);
  }

  const useForInventory = formData.get("useForInventory") === "true";

  return NextResponse.json({
    detectedItems: ["milk", "carrots", "spinach"],
    mode: useForInventory ? "inventory_update" : "suggestions_only",
  });
}
