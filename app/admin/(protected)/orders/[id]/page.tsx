import Link from "next/link";
import { notFound } from "next/navigation";
import { formatMoney } from "@/data/catalog";
import { getOrder, type OrderStatus } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const statuses: Array<{ value: OrderStatus; label: string }> = [
  { value: "NEW", label: "New" },
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "IN_PRODUCTION", label: "In production" },
  { value: "READY", label: "Ready" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" }
];

export default async function AdminOrderDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string }> }) {
  const { id } = await params;
  const query = await searchParams;
  const result = getOrder(id);
  if (!result) notFound();
  const { order, items } = result;

  return (
    <div className="admin-page">
      <div className="order-detail-topline"><Link href="/admin/orders">← Back to orders</Link><span>{order.id}</span></div>
      <header className="admin-page-header">
        <div><p className="admin-kicker">Order request</p><h1>{order.studentName}</h1><p>Submitted {new Intl.DateTimeFormat("en-GB", { dateStyle: "long", timeStyle: "short" }).format(new Date(order.createdAt))}</p></div>
        <strong className="detail-total">{formatMoney(order.total)}</strong>
      </header>
      {query.saved ? <div className="admin-alert success">Order status updated.</div> : null}

      <div className="order-detail-grid">
        <div>
          <section className="admin-panel detail-panel">
            <div className="detail-panel-heading"><h2>Selected items</h2><span>{items.reduce((sum, item) => sum + item.quantity, 0)} items</span></div>
            <div>
              {items.map((item) => (
                <div className="detail-item" key={item.id}>
                  <div><strong>{item.productName}</strong><span>Size {item.size} · Qty {item.quantity}</span></div>
                  <div><span>{formatMoney(item.unitPrice)} each</span><strong>{formatMoney(item.total)}</strong></div>
                </div>
              ))}
            </div>
          </section>

          <section className="admin-panel detail-panel">
            <div className="detail-panel-heading"><h2>Parent & student</h2></div>
            <dl className="detail-list">
              <div><dt>Student</dt><dd>{order.studentName}</dd></div>
              <div><dt>Grade</dt><dd>{order.grade}</dd></div>
              <div><dt>Parent / guardian</dt><dd>{order.parentName}</dd></div>
              <div><dt>E-mail</dt><dd><a href={`mailto:${order.email}`}>{order.email}</a></dd></div>
              <div><dt>Phone</dt><dd><a href={`tel:${order.phone}`}>{order.phone}</a></dd></div>
              <div><dt>Measurements</dt><dd>{[order.height && `Height ${order.height} cm`, order.chest && `Chest ${order.chest} cm`, order.waist && `Waist ${order.waist} cm`].filter(Boolean).join(" · ") || "Not provided"}</dd></div>
            </dl>
            {order.notes ? <div className="detail-notes"><span>Notes</span><p>{order.notes}</p></div> : null}
          </section>
        </div>

        <aside>
          <section className="admin-panel status-panel">
            <p className="admin-kicker">Workflow</p><h2>Order status</h2>
            <form action={`/api/admin/orders/${encodeURIComponent(order.id)}`} method="post">
              <label><span>Status</span><select name="status" defaultValue={order.status}>{statuses.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}</select></label>
              <button className="admin-primary" type="submit">Update status</button>
            </form>
          </section>
          <section className="admin-panel delivery-panel">
            <p className="admin-kicker">E-mail delivery</p>
            <strong className={order.emailSent ? "email-ok" : "email-failed"}>{order.emailSent ? "Sent successfully" : "Delivery failed"}</strong>
            {order.emailError ? <small>{order.emailError}</small> : <small>The request is stored in SQLite regardless of e-mail status.</small>}
          </section>
        </aside>
      </div>
    </div>
  );
}
