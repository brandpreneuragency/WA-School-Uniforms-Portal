import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { createProduct, getProduct } from "@/lib/db";

export const runtime = "nodejs";

function slugify(value: string) {
  return value.toLowerCase().trim().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 60);
}

export async function POST(request: Request) {
  if (!(await isAdmin())) return NextResponse.redirect(new URL("/admin/login", request.url), 303);
  const form = await request.formData();
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
  let id = slugify(name) || `product-${Date.now()}`;
  let suffix = 2;
  while (getProduct(id)) id = `${slugify(name)}-${suffix++}`;
  createProduct({ id, name, category, price, image, description, sizes, active: form.get("active") === "on", sortOrder: Number.isFinite(sortOrder) ? sortOrder : 999 });
  return NextResponse.redirect(new URL("/admin/catalogue?saved=1", request.url), 303);
}
