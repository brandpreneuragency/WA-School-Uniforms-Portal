import Link from "next/link";
import { formatMoney } from "@/data/catalog";
import { getOrderCounts, listOrders, type OrderStatus } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const filters: Array<{ value: "ALL" | OrderStatus; label: string }> = [
  { value: "ALL", label: "All" },
  { value: "NEW", label: "New" },
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "IN_PRODUCTION", label: "In production" },
  { value: "READY", label: "Ready" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" }
];

function niceStatus(status: string) {
  return status.toLowerCase().replaceAll("_", " ").replace(/(^|\s)\S/g, (letter) => letter.toUpperCase());
}

export default async function AdminOrdersPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const query = await searchParams;
  const selected = filters.some((filter) => filter.value === query.status) ? query.status! : "ALL";
  const orders = listOrders(selected);
  const counts = getOrderCounts();

  return (
    <div className="admin-page">
      <header className="admin-page-header">
        <div><p className="admin-kicker">Orders</p><h1>Order requests</h1><p>Every submitted request is stored here, even if e-mail delivery fails.</p></div>
        <span className="admin-stat">{counts.ALL || 0} total</span>
      </header>

      <div className="order-filters">
        {filters.map((filter) => (
          <Link className={selected === filter.value ? "active" : ""} key={filter.value} href={filter.value === "ALL" ? "/admin/orders" : `/admin/orders?status=${filter.value}`}>
            {filter.label}<span>{counts[filter.value] || 0}</span>
          </Link>
        ))}
      </div>

      <section className="admin-panel order-table-wrap">
        {orders.length ? (
          <table className="order-table">
            <thead><tr><th>Reference</th><th>Student</th><th>Parent</th><th>Submitted</th><th>Status</th><th>E-mail</th><th className="money-cell">Total</th></tr></thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td><Link className="order-ref" href={`/admin/orders/${encodeURIComponent(order.id)}`}>{order.id}</Link></td>
                  <td><strong>{order.studentName}</strong><small>{order.grade}</small></td>
                  <td><span>{order.parentName}</span><small>{order.phone}</small></td>
                  <td><span>{new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" }).format(new Date(order.createdAt))}</span><small>{new Intl.DateTimeFormat("en-GB", { timeStyle: "short" }).format(new Date(order.createdAt))}</small></td>
                  <td><span className={`order-status status-${order.status.toLowerCase()}`}>{niceStatus(order.status)}</span></td>
                  <td><span className={order.emailSent ? "email-ok" : "email-failed"}>{order.emailSent ? "Sent" : "Failed"}</span></td>
                  <td className="money-cell"><strong>{formatMoney(order.total)}</strong></td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : <div className="admin-empty"><strong>No orders here yet.</strong><span>New requests will appear automatically when parents submit the portal form.</span></div>}
      </section>
    </div>
  );
}
