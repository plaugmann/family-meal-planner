import { NextResponse } from "next/server";
import { jsonError, parseJson } from "@/lib/api";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const payload = await parseJson<{ name?: string; quantity?: string | null; isChecked?: boolean }>(request);
  if (!payload) {
    return jsonError("VALIDATION_ERROR", "Request body required.", 400);
  }

  try {
    const item = await prisma.shoppingListItem.update({
      where: { id: params.id },
      data: {
        ...(payload.name !== undefined && { name: payload.name }),
        ...(payload.quantity !== undefined && { quantity: payload.quantity }),
        ...(payload.isChecked !== undefined && { isChecked: payload.isChecked }),
      },
    });
    return NextResponse.json({ item });
  } catch {
    return jsonError("NOT_FOUND", "Item not found.", 404);
  }
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  try {
    await prisma.shoppingListItem.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch {
    return jsonError("NOT_FOUND", "Item not found.", 404);
  }
}
