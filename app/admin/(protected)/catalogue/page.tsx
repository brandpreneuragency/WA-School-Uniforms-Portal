import Image from "next/image";
import { getAllProducts } from "@/lib/db";
import { formatMoney } from "@/data/catalog";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function AdminCataloguePage({ searchParams }: { searchParams: Promise<{ saved?: string; error?: string }> }) {
  const query = await searchParams;
  const products = getAllProducts();

  return (
    <div className="admin-page">
      <header className="admin-page-header">
        <div><p className="admin-kicker">Catalogue</p><h1>Uniform products</h1><p>Edit what parents see without touching the application code.</p></div>
        <span className="admin-stat">{products.length} products</span>
      </header>

      {query.saved ? <div className="admin-alert success">Catalogue updated.</div> : null}
      {query.error ? <div className="admin-alert error">Could not save that product. Check the fields and try again.</div> : null}

      <details className="admin-panel add-product">
        <summary>+ Add product</summary>
        <form action="/api/admin/products" method="post" className="product-admin-form">
          <div className="admin-form-grid">
            <label><span>Product name</span><input name="name" required /></label>
            <label><span>Category</span><select name="category"><option value="required">Required</option><option value="optional">Optional</option></select></label>
            <label><span>Price</span><input name="price" type="number" min="0" step="0.01" required /></label>
            <label><span>Sort order</span><input name="sortOrder" type="number" defaultValue="999" /></label>
            <label className="wide"><span>Description</span><input name="description" /></label>
            <label className="wide"><span>Image path</span><input name="image" defaultValue="/products/blazer.svg" required /></label>
            <label className="wide"><span>Sizes <small>comma separated</small></span><input name="sizes" placeholder="6, 8, 10, 12, 14, 16" required /></label>
          </div>
          <label className="admin-checkbox"><input type="checkbox" name="active" defaultChecked /> Active in catalogue</label>
          <button className="admin-primary" type="submit">Add product</button>
        </form>
      </details>

      <div className="catalogue-admin-list">
        {products.map((product) => (
          <article className={`admin-panel product-admin-row ${product.active ? "" : "is-disabled"}`} key={product.id}>
            <div className="product-admin-preview">
              <Image src={product.image} alt="" width={88} height={88} />
              <div><strong>{product.name}</strong><span>{product.category === "required" ? "Required" : "Optional"} · {formatMoney(product.price)}</span><small>{product.active ? "Visible" : "Hidden"}</small></div>
            </div>
            <details>
              <summary>Edit</summary>
              <form action={`/api/admin/products/${encodeURIComponent(product.id)}`} method="post" className="product-admin-form">
                <div className="admin-form-grid">
                  <label><span>Product name</span><input name="name" defaultValue={product.name} required /></label>
                  <label><span>Category</span><select name="category" defaultValue={product.category}><option value="required">Required</option><option value="optional">Optional</option></select></label>
                  <label><span>Price</span><input name="price" type="number" min="0" step="0.01" defaultValue={product.price} required /></label>
                  <label><span>Sort order</span><input name="sortOrder" type="number" defaultValue={product.sortOrder} /></label>
                  <label className="wide"><span>Description</span><input name="description" defaultValue={product.description} /></label>
                  <label className="wide"><span>Image path</span><input name="image" defaultValue={product.image} required /></label>
                  <label className="wide"><span>Sizes <small>comma separated</small></span><input name="sizes" defaultValue={product.sizes.join(", ")} required /></label>
                </div>
                <label className="admin-checkbox"><input type="checkbox" name="active" defaultChecked={product.active} /> Active in catalogue</label>
                <div className="admin-form-actions">
                  <button className="admin-primary" type="submit">Save changes</button>
                  <button className="admin-danger" type="submit" name="action" value="delete" formNoValidate>Delete</button>
                </div>
              </form>
            </details>
          </article>
        ))}
      </div>
    </div>
  );
}
