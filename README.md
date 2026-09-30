# WA School Uniforms Portal 2

A deliberately small school-uniform order request portal for Wagner Atelier.

Parents enter student/contact details, select uniform items, sizes and quantities, then submit one order request. There is **no account system, database, checkout or online payment**. The server validates the selected items against the local catalogue and emails the request to Wagner Atelier.

## Stack

- Next.js App Router
- React + TypeScript
- Plain CSS
- Catalogue stored in `data/catalog.ts`
- One API route: `POST /api/order`
- Resend HTTP API for production e-mail delivery

No Prisma, PostgreSQL, auth library, admin panel or state-management dependency.

## Local development

```bash
npm install
npm run dev
```

Development defaults to `ORDER_EMAIL_MODE=console`, so submitted orders are printed in the server console instead of being sent.

## Production e-mail

Copy `.env.example` to your deployment environment and set:

```env
ORDER_EMAIL_MODE=resend
RESEND_API_KEY=re_xxxxxxxxx
ORDER_EMAIL_TO=orders@example.com
ORDER_EMAIL_FROM=Wagner Atelier Orders <orders@your-verified-domain.com>
ORDER_REPLY_TO=orders@example.com
```

`ORDER_EMAIL_FROM` must use a sender/domain verified by Resend.

## Editing the catalogue

All school and product data is intentionally kept in one file:

`data/catalog.ts`

There you can change:

- school name and tagline
- currency and locale
- whether prices are visible
- grade options
- product names/descriptions
- product prices
- product sizes
- required vs optional groups
- product image paths

Replace the placeholder SVG files in `public/products/` with real product photos while keeping the same paths, or update the paths in the catalogue.

## Order security

The browser submits only product IDs, chosen sizes and quantities. The API route re-loads the real catalogue and recalculates prices server-side, so a visitor cannot change product prices by editing the browser payload. Required contact fields are validated server-side and a honeypot field is included for basic bot filtering.

## Deployment

Works on any standard Next.js host (Vercel, Node server, Docker-capable VPS, etc.). The only required production integration is the e-mail environment configuration above.
