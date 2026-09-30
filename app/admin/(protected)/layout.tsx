import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <Link className="admin-brand" href="/admin/orders">
          <span className="admin-mark">WA</span>
          <span><strong>Wagner Atelier</strong><small>School Uniform Portal</small></span>
        </Link>
        <nav>
          <Link href="/admin/orders">Orders</Link>
          <Link href="/admin/catalogue">Catalogue</Link>
          <Link href="/" target="_blank">View portal ↗</Link>
        </nav>
        <form action="/api/admin/logout" method="post" className="admin-logout">
          <button type="submit">Sign out</button>
        </form>
      </aside>
      <div className="admin-main">{children}</div>
    </div>
  );
}
