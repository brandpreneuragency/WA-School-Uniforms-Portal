import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const ADMIN_COOKIE = "wa_admin";
const SESSION_SECONDS = 60 * 60 * 12;

function adminPassword() {
  if (process.env.ADMIN_PASSWORD) return process.env.ADMIN_PASSWORD;
  if (process.env.NODE_ENV !== "production") return "admin";
  return "";
}

function sessionSecret() {
  if (process.env.ADMIN_SESSION_SECRET) return process.env.ADMIN_SESSION_SECRET;
  if (process.env.NODE_ENV !== "production") return "wa-school-portal-development-secret";
  return "";
}

function signature(payload: string) {
  return createHmac("sha256", sessionSecret()).update(payload).digest("base64url");
}

export function verifyAdminPassword(candidate: string) {
  const expected = Buffer.from(adminPassword());
  const supplied = Buffer.from(candidate);
  if (!expected.length || expected.length !== supplied.length) return false;
  return timingSafeEqual(expected, supplied);
}

export function createAdminSessionToken() {
  const payload = `admin:${Math.floor(Date.now() / 1000) + SESSION_SECONDS}`;
  return `${Buffer.from(payload).toString("base64url")}.${signature(payload)}`;
}

export function verifyAdminSessionToken(token: string | undefined) {
  if (!token || !sessionSecret()) return false;
  const [encodedPayload, suppliedSignature] = token.split(".");
  if (!encodedPayload || !suppliedSignature) return false;
  let payload = "";
  try {
    payload = Buffer.from(encodedPayload, "base64url").toString("utf8");
  } catch {
    return false;
  }
  const expectedSignature = signature(payload);
  const expected = Buffer.from(expectedSignature);
  const supplied = Buffer.from(suppliedSignature);
  if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) return false;
  const [role, expiry] = payload.split(":");
  return role === "admin" && Number(expiry) > Math.floor(Date.now() / 1000);
}

export async function isAdmin() {
  const store = await cookies();
  return verifyAdminSessionToken(store.get(ADMIN_COOKIE)?.value);
}

export async function requireAdmin() {
  if (!(await isAdmin())) redirect("/admin/login");
}

export function adminCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_SECONDS
  };
}
