import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { updateOrderStatus, type OrderStatus } from "@/lib/db";

export const runtime = "nodejs";

const allowed: OrderStatus[] = ["NEW", "CONFIRMED", "IN_PRODUCTION", "READY", "COMPLETED", "CANCELLED"];

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return NextResponse.redirect(new URL("/admin/login", request.url), 303);
  const { id } = await context.params;
  const form = await request.formData();
  const status = String(form.get("status") || "") as OrderStatus;
  if (allowed.includes(status)) updateOrderStatus(id, status);
  return NextResponse.redirect(new URL(`/admin/orders/${encodeURIComponent(id)}?saved=1`, request.url), 303);
}
