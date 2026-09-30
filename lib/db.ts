import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { products as seedProducts, type Product } from "@/data/catalog";

export type OrderStatus = "NEW" | "CONFIRMED" | "IN_PRODUCTION" | "READY" | "COMPLETED" | "CANCELLED";

export type OrderRecord = {
  id: string;
  createdAt: string;
  studentName: string;
  grade: string;
  parentName: string;
  email: string;
  phone: string;
  height: string;
  chest: string;
  waist: string;
  notes: string;
  status: OrderStatus;
  currency: string;
  total: number;
  emailSent: boolean;
  emailError: string;
};

export type OrderItemRecord = {
  id: number;
  orderId: string;
  productId: string;
  productName: string;
  size: string;
  quantity: number;
  unitPrice: number;
  total: number;
};

const databasePath = process.env.SQLITE_PATH || join(process.cwd(), ".data", "portal.sqlite");
mkdirSync(dirname(databasePath), { recursive: true });

const db = new DatabaseSync(databasePath, { timeout: 5000 });
db.exec("PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL;");

db.exec(`
  CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    category TEXT NOT NULL CHECK (category IN ('required', 'optional')),
    price REAL NOT NULL DEFAULT 0,
    image TEXT NOT NULL DEFAULT '',
    sizes TEXT NOT NULL DEFAULT '[]',
    active INTEGER NOT NULL DEFAULT 1,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  ) STRICT;

  CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    created_at TEXT NOT NULL,
    student_name TEXT NOT NULL,
    grade TEXT NOT NULL,
    parent_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    height TEXT NOT NULL DEFAULT '',
    chest TEXT NOT NULL DEFAULT '',
    waist TEXT NOT NULL DEFAULT '',
    notes TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'NEW',
    currency TEXT NOT NULL,
    total REAL NOT NULL DEFAULT 0,
    email_sent INTEGER NOT NULL DEFAULT 0,
    email_error TEXT NOT NULL DEFAULT ''
  ) STRICT;

  CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id TEXT NOT NULL,
    product_name TEXT NOT NULL,
    size TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price REAL NOT NULL,
    total REAL NOT NULL
  ) STRICT;

  CREATE INDEX IF NOT EXISTS orders_created_at_idx ON orders(created_at DESC);
  CREATE INDEX IF NOT EXISTS orders_status_idx ON orders(status);
  CREATE INDEX IF NOT EXISTS order_items_order_id_idx ON order_items(order_id);
`);

const productCount = db.prepare("SELECT COUNT(*) AS count FROM products").get() as { count: number };
if (productCount.count === 0) {
  const insert = db.prepare(`
    INSERT INTO products (id, name, description, category, price, image, sizes, active, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)
  `);
  db.exec("BEGIN IMMEDIATE");
  try {
    seedProducts.forEach((product, index) => {
      insert.run(product.id, product.name, product.description || "", product.category, product.price, product.image, JSON.stringify(product.sizes), index);
    });
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

function productFromRow(row: Record<string, unknown>): Product & { active: boolean; sortOrder: number } {
  return {
    id: String(row.id),
    name: String(row.name),
    description: String(row.description || ""),
    category: row.category === "optional" ? "optional" : "required",
    price: Number(row.price),
    image: String(row.image || ""),
    sizes: JSON.parse(String(row.sizes || "[]")) as string[],
    active: Boolean(row.active),
    sortOrder: Number(row.sort_order)
  };
}

export function getPublicProducts(): Product[] {
  const rows = db.prepare("SELECT * FROM products WHERE active = 1 ORDER BY sort_order ASC, name ASC").all() as Record<string, unknown>[];
  return rows.map(productFromRow);
}

export function getAllProducts() {
  const rows = db.prepare("SELECT * FROM products ORDER BY sort_order ASC, name ASC").all() as Record<string, unknown>[];
  return rows.map(productFromRow);
}

export function getProduct(productId: string) {
  const row = db.prepare("SELECT * FROM products WHERE id = ?").get(productId) as Record<string, unknown> | undefined;
  return row ? productFromRow(row) : null;
}

export function createProduct(input: Product & { active?: boolean; sortOrder?: number }) {
  db.prepare(`
    INSERT INTO products (id, name, description, category, price, image, sizes, active, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    input.id,
    input.name,
    input.description || "",
    input.category,
    input.price,
    input.image,
    JSON.stringify(input.sizes),
    input.active === false ? 0 : 1,
    input.sortOrder ?? 999
  );
}

export function updateProduct(productId: string, input: Omit<Product, "id"> & { active: boolean; sortOrder: number }) {
  db.prepare(`
    UPDATE products SET name = ?, description = ?, category = ?, price = ?, image = ?, sizes = ?, active = ?, sort_order = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(input.name, input.description || "", input.category, input.price, input.image, JSON.stringify(input.sizes), input.active ? 1 : 0, input.sortOrder, productId);
}

export function deleteProduct(productId: string) {
  db.prepare("DELETE FROM products WHERE id = ?").run(productId);
}

export function insertOrder(order: OrderRecord, items: Omit<OrderItemRecord, "id">[]) {
  const insertOrderStatement = db.prepare(`
    INSERT INTO orders (id, created_at, student_name, grade, parent_name, email, phone, height, chest, waist, notes, status, currency, total, email_sent, email_error)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertItem = db.prepare(`
    INSERT INTO order_items (order_id, product_id, product_name, size, quantity, unit_price, total)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  db.exec("BEGIN IMMEDIATE");
  try {
    insertOrderStatement.run(
      order.id, order.createdAt, order.studentName, order.grade, order.parentName, order.email, order.phone,
      order.height, order.chest, order.waist, order.notes, order.status, order.currency, order.total,
      order.emailSent ? 1 : 0, order.emailError
    );
    items.forEach((item) => insertItem.run(item.orderId, item.productId, item.productName, item.size, item.quantity, item.unitPrice, item.total));
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

export function markOrderEmailResult(orderId: string, sent: boolean, error = "") {
  db.prepare("UPDATE orders SET email_sent = ?, email_error = ? WHERE id = ?").run(sent ? 1 : 0, error.slice(0, 1000), orderId);
}

function orderFromRow(row: Record<string, unknown>): OrderRecord {
  return {
    id: String(row.id),
    createdAt: String(row.created_at),
    studentName: String(row.student_name),
    grade: String(row.grade),
    parentName: String(row.parent_name),
    email: String(row.email),
    phone: String(row.phone),
    height: String(row.height || ""),
    chest: String(row.chest || ""),
    waist: String(row.waist || ""),
    notes: String(row.notes || ""),
    status: String(row.status) as OrderStatus,
    currency: String(row.currency),
    total: Number(row.total),
    emailSent: Boolean(row.email_sent),
    emailError: String(row.email_error || "")
  };
}

export function listOrders(status?: string) {
  const rows = status && status !== "ALL"
    ? db.prepare("SELECT * FROM orders WHERE status = ? ORDER BY created_at DESC").all(status)
    : db.prepare("SELECT * FROM orders ORDER BY created_at DESC").all();
  return (rows as Record<string, unknown>[]).map(orderFromRow);
}

export function getOrder(orderId: string) {
  const row = db.prepare("SELECT * FROM orders WHERE id = ?").get(orderId) as Record<string, unknown> | undefined;
  if (!row) return null;
  const itemRows = db.prepare("SELECT * FROM order_items WHERE order_id = ? ORDER BY id ASC").all(orderId) as Record<string, unknown>[];
  const items: OrderItemRecord[] = itemRows.map((item) => ({
    id: Number(item.id),
    orderId: String(item.order_id),
    productId: String(item.product_id),
    productName: String(item.product_name),
    size: String(item.size),
    quantity: Number(item.quantity),
    unitPrice: Number(item.unit_price),
    total: Number(item.total)
  }));
  return { order: orderFromRow(row), items };
}

export function updateOrderStatus(orderId: string, status: OrderStatus) {
  db.prepare("UPDATE orders SET status = ? WHERE id = ?").run(status, orderId);
}

export function getOrderCounts() {
  const rows = db.prepare("SELECT status, COUNT(*) AS count FROM orders GROUP BY status").all() as Array<{ status: string; count: number }>;
  const counts: Record<string, number> = { ALL: 0 };
  rows.forEach((row) => {
    counts[row.status] = Number(row.count);
    counts.ALL += Number(row.count);
  });
  return counts;
}
