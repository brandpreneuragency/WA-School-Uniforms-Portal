import { isAdmin } from "@/lib/admin-auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function AdminLoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  if (await isAdmin()) redirect("/admin/orders");
  const query = await searchParams;
  return (
    <main className="login-page">
      <section className="login-card">
        <div className="login-mark">WA</div>
        <p className="admin-kicker">Wagner Atelier</p>
        <h1>Portal administration</h1>
        <p>Manage the school catalogue and incoming order requests.</p>
        {query.error ? <div className="admin-alert error">Incorrect password.</div> : null}
        <form action="/api/admin/login" method="post">
          <label><span>Password</span><input type="password" name="password" required autoFocus autoComplete="current-password" /></label>
          <button type="submit" className="admin-primary">Sign in</button>
        </form>
        {process.env.NODE_ENV !== "production" && !process.env.ADMIN_PASSWORD ? <small className="dev-note">Development password: <code>admin</code></small> : null}
      </section>
    </main>
  );
}
