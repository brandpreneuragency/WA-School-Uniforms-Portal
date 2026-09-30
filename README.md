# WA School Uniforms Portal 2

A deliberately small school-uniform order request portal for Wagner Atelier.

Parents enter student/contact details, select uniform items, sizes and quantities, then submit one order request. There is **no online payment**. Requests are stored in SQLite and can also be e-mailed to Wagner Atelier.

## Included

- Public uniform catalogue
- Student + parent order form
- Size and quantity selection
- SQLite persistence
- Resend e-mail notifications
- Password-protected `/admin`
- Catalogue management
- Orders list, filters and order detail
- Order status workflow

No Prisma, PostgreSQL, parent accounts, multi-role school hierarchy or ERP-style architecture.

## Requirements

- Node.js 22.13 or newer

The project uses Node's built-in `node:sqlite` module, which is available without a separate database package on supported Node 22 releases.

## Run locally

```bash
npm install
npm run dev
```

Open:

- Parent portal: `http://localhost:3000`
- Admin: `http://localhost:3000/admin`

In development, if `ADMIN_PASSWORD` is not set, the admin password is:

```text
admin
```

## Environment

Copy `.env.example` to `.env.local` and set real values before deployment.

```env
ADMIN_PASSWORD=choose-a-strong-password
ADMIN_SESSION_SECRET=choose-a-long-random-secret
SQLITE_PATH=.data/portal.sqlite

ORDER_EMAIL_MODE=resend
RESEND_API_KEY=re_xxxxxxxxx
ORDER_EMAIL_TO=orders@example.com
ORDER_EMAIL_FROM=Wagner Atelier Orders <orders@your-verified-domain.com>
ORDER_REPLY_TO=orders@example.com
```

In development, e-mail defaults to console mode when `ORDER_EMAIL_MODE` is omitted.

## Admin

### Catalogue

`/admin/catalogue`

You can add, edit, hide and delete products; change prices, sizes, Required/Optional status, display order and image paths.

The original records in `data/catalog.ts` are used only to seed a brand-new empty SQLite database. After first run, SQLite becomes the live catalogue source.

### Orders

`/admin/orders`

Each order is stored **before** the e-mail notification is attempted. If Resend fails, the request still appears in Admin.

Workflow:

```text
New → Confirmed → In production → Ready → Completed
                                      ↘ Cancelled
```

The detail page shows student/parent details, measurements, notes, selected items, quantities, totals and e-mail delivery status.

## Database

Default path:

```text
.data/portal.sqlite
```

The directory is gitignored. Back up this file on the VPS. You can move it with `SQLITE_PATH`.

## Security

Product IDs, sizes and quantities come from the browser, but the order endpoint reloads the actual products from SQLite and recalculates prices server-side.

Admin authentication uses one password plus a signed, HTTP-only session cookie. This intentionally avoids a full user/account system.

## Deployment

This version is designed for a persistent Node/VPS environment because it uses a local SQLite file. Do not deploy it to ephemeral serverless storage unless the database layer is changed.
