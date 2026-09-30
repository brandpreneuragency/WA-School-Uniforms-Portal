import { NextResponse } from "next/server";
import { portalConfig, products } from "@/data/catalog";

type IncomingItem = { productId?: unknown; size?: unknown; quantity?: unknown };

type IncomingOrder = {
  studentName?: unknown;
  grade?: unknown;
  parentName?: unknown;
  email?: unknown;
  phone?: unknown;
  height?: unknown;
  chest?: unknown;
  waist?: unknown;
  notes?: unknown;
  items?: unknown;
  website?: unknown;
};

const clean = (value: unknown, max = 200) => typeof value === "string" ? value.trim().slice(0, max) : "";
const escapeHtml = (value: string) => value.replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char]!));

function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;
}

function money(value: number) {
  return new Intl.NumberFormat(portalConfig.locale, { style: "currency", currency: portalConfig.currency }).format(value);
}

export async function POST(request: Request) {
  let payload: IncomingOrder;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid request." }, { status: 400 });
  }

  // Honeypot. Real users never see or populate this field.
  if (clean(payload.website, 100)) return NextResponse.json({ ok: true });

  const studentName = clean(payload.studentName, 120);
  const grade = clean(payload.grade, 60);
  const parentName = clean(payload.parentName, 120);
  const email = clean(payload.email, 254).toLowerCase();
  const phone = clean(payload.phone, 60);
  const height = clean(payload.height, 20);
  const chest = clean(payload.chest, 20);
  const waist = clean(payload.waist, 20);
  const notes = clean(payload.notes, 1000);

  if (!studentName || !grade || !parentName || !phone || !validateEmail(email)) {
    return NextResponse.json({ message: "Please complete the required student and parent details." }, { status: 400 });
  }

  if (!Array.isArray(payload.items) || payload.items.length < 1 || payload.items.length > 30) {
    return NextResponse.json({ message: "Please add at least one valid item." }, { status: 400 });
  }

  const normalizedItems = [] as Array<{ name: string; size: string; quantity: number; unitPrice: number; total: number }>;
  for (const raw of payload.items as IncomingItem[]) {
    const productId = clean(raw.productId, 80);
    const size = clean(raw.size, 30);
    const quantity = Number(raw.quantity);
    const product = products.find((candidate) => candidate.id === productId);
    if (!product || !product.sizes.includes(size) || !Number.isInteger(quantity) || quantity < 1 || quantity > 20) {
      return NextResponse.json({ message: "One or more selected products are invalid. Please review your order." }, { status: 400 });
    }
    normalizedItems.push({ name: product.name, size, quantity, unitPrice: product.price, total: product.price * quantity });
  }

  const total = normalizedItems.reduce((sum, item) => sum + item.total, 0);
  const reference = `WA-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;

  const itemsHtml = normalizedItems.map((item) => `
    <tr>
      <td style="padding:12px 10px;border-bottom:1px solid #e5e7eb"><strong>${escapeHtml(item.name)}</strong></td>
      <td style="padding:12px 10px;border-bottom:1px solid #e5e7eb">${escapeHtml(item.size)}</td>
      <td style="padding:12px 10px;border-bottom:1px solid #e5e7eb;text-align:center">${item.quantity}</td>
      <td style="padding:12px 10px;border-bottom:1px solid #e5e7eb;text-align:right">${money(item.total)}</td>
    </tr>`).join("");

  const html = `<!doctype html><html><body style="font-family:Arial,sans-serif;color:#172033;background:#f6f7f9;padding:24px">
    <div style="max-width:720px;margin:auto;background:#fff;border:1px solid #e4e7ec;border-radius:14px;overflow:hidden">
      <div style="padding:24px 28px;background:#0f2744;color:#fff"><div style="font-size:12px;text-transform:uppercase;letter-spacing:.1em;opacity:.75">Wagner Atelier</div><h1 style="font-size:22px;margin:8px 0 0">New school uniform order request</h1></div>
      <div style="padding:26px 28px">
        <p style="margin-top:0;color:#667085">Reference: <strong style="color:#172033">${reference}</strong></p>
        <h2 style="font-size:16px;margin:26px 0 12px">Student & parent</h2>
        <table style="width:100%;border-collapse:collapse;font-size:14px">
          <tr><td style="padding:7px 0;color:#667085;width:180px">Student</td><td><strong>${escapeHtml(studentName)}</strong></td></tr>
          <tr><td style="padding:7px 0;color:#667085">Grade</td><td>${escapeHtml(grade)}</td></tr>
          <tr><td style="padding:7px 0;color:#667085">Parent / guardian</td><td>${escapeHtml(parentName)}</td></tr>
          <tr><td style="padding:7px 0;color:#667085">Email</td><td>${escapeHtml(email)}</td></tr>
          <tr><td style="padding:7px 0;color:#667085">Phone</td><td>${escapeHtml(phone)}</td></tr>
          <tr><td style="padding:7px 0;color:#667085">Measurements</td><td>${escapeHtml([height && `Height ${height} cm`, chest && `Chest ${chest} cm`, waist && `Waist ${waist} cm`].filter(Boolean).join(" · ") || "Not provided")}</td></tr>
        </table>
        <h2 style="font-size:16px;margin:28px 0 10px">Selected items</h2>
        <table style="width:100%;border-collapse:collapse;font-size:14px"><thead><tr style="background:#f8fafc"><th style="text-align:left;padding:10px">Item</th><th style="text-align:left;padding:10px">Size</th><th style="padding:10px">Qty</th><th style="text-align:right;padding:10px">Total</th></tr></thead><tbody>${itemsHtml}</tbody></table>
        ${portalConfig.showPrices ? `<p style="font-size:18px;text-align:right;margin:18px 0 0"><span style="color:#667085;font-size:13px">Estimated total</span><br><strong>${money(total)}</strong></p>` : ""}
        ${notes ? `<h2 style="font-size:16px;margin:28px 0 8px">Notes</h2><p style="white-space:pre-wrap;background:#f8fafc;padding:14px;border-radius:8px">${escapeHtml(notes)}</p>` : ""}
      </div>
    </div></body></html>`;

  const mode = process.env.ORDER_EMAIL_MODE || (process.env.NODE_ENV === "production" ? "resend" : "console");
  if (mode === "console") {
    console.log("[order-request]", { reference, studentName, grade, parentName, email, phone, normalizedItems, total, notes });
    return NextResponse.json({ ok: true, reference });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.ORDER_EMAIL_TO;
  const from = process.env.ORDER_EMAIL_FROM;
  if (!apiKey || !to || !from) {
    console.error("Order e-mail configuration is incomplete.");
    return NextResponse.json({ message: "Order e-mail is not configured. Please contact Wagner Atelier directly." }, { status: 503 });
  }

  const emailResponse = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to: [to],
      reply_to: process.env.ORDER_REPLY_TO || email,
      subject: `${reference} · ${studentName} · School uniform request`,
      html
    })
  });

  if (!emailResponse.ok) {
    console.error("Resend request failed", emailResponse.status, await emailResponse.text());
    return NextResponse.json({ message: "We could not send the order request. Please try again." }, { status: 502 });
  }

  return NextResponse.json({ ok: true, reference });
}
