import { OrderPortal } from "@/components/order-portal";
import { getPublicProducts } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default function Home() {
  return <OrderPortal products={getPublicProducts()} />;
}
