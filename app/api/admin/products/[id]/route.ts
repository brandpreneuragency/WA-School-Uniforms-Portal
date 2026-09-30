import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { deleteProduct, updateProduct } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return NextResponse.redirect(new URL("/admin/login", request.url), 303);
  const { id } = await context.params;
  const form = await request.formData();

  if (form.get("action") === "delete") {
    try {
      deleteProduct(id);
    } catch {
      return NextResponse.redirect(new URL("/admin/catalogue?error=1", request.url), 303);
    }
    return NextResponse.redirect(new URL("/admin/catalogue?saved=1", request.url), 303);
  }

  const name = String(form.get("name") || "").trim();
  const category = form.get("category") === "optional" ? "optional" : "required";
  const price = Number(form.get("price"));
  const image = String(form.get("image") || "").trim();
  const description = String(form.get("description") || "").trim();
  const sizes = String(form.get("sizes") || "").split(",").map((value) => value.trim()).filter(Boolean).slice(0, 30);
  const sortOrder = Number(form.get("sortOrder") || 999);
  if (!name || !Number.isFinite(price) || price < 0 || !image || !sizes.length) {
    return NextResponse.redirect(new URL("/admin/catalogue?error=1", request.url), 303);
  }
  updateProduct(id, { name, description, category, price, image, sizes, active: form.get("active") === "on", sortOrder: Number.isFinite(sortOrder) ? sortOrder : 999 });
  return NextResponse.redirect(new URL("/admin/catalogue?saved=1", request.url), 303);
}
