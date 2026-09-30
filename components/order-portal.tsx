"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { formatMoney, portalConfig, type Product } from "@/data/catalog";
import { ArrowIcon, CartIcon, CheckIcon, InfoIcon, MailIcon } from "@/components/icons";

type SelectedItem = {
  productId: string;
  size: string;
  quantity: number;
};

type ProductDraft = {
  size: string;
  quantity: number;
};

type FormState = {
  studentName: string;
  grade: string;
  parentName: string;
  email: string;
  phone: string;
  height: string;
  chest: string;
  waist: string;
  notes: string;
  website: string;
};

const initialForm: FormState = {
  studentName: "",
  grade: "",
  parentName: "",
  email: "",
  phone: "",
  height: "",
  chest: "",
  waist: "",
  notes: "",
  website: ""
};

function productDrafts() {
  return Object.fromEntries(products.map((product) => [product.id, { size: product.sizes[0], quantity: 1 }])) as Record<string, ProductDraft>;
}

function ProductCard({ product, draft, selected, onDraft, onAdd }: {
  product: Product;
  draft: ProductDraft;
  selected?: SelectedItem;
  onDraft: (draft: ProductDraft) => void;
  onAdd: () => void;
}) {
  return (
    <article className="product-card">
      <div className="product-image-wrap">
        <Image src={product.image} alt="" width={360} height={360} className="product-image" priority={product.category === "required"} />
        {selected ? <span className="selected-badge"><CheckIcon /> Added</span> : null}
      </div>
      <div className="product-body">
        <div className="product-title-row">
          <div>
            <h3>{product.name}</h3>
            <p>{product.description}</p>
          </div>
          {portalConfig.showPrices ? <strong className="price">{formatMoney(product.price)}</strong> : null}
        </div>

        <div className="option-block">
          <span className="field-caption">Size</span>
          <div className="size-options" role="group" aria-label={`Choose size for ${product.name}`}>
            {product.sizes.map((size) => (
              <button
                type="button"
                key={size}
                className={draft.size === size ? "size-chip active" : "size-chip"}
                onClick={() => onDraft({ ...draft, size })}
                aria-pressed={draft.size === size}
              >{size}</button>
            ))}
          </div>
        </div>

        <div className="card-actions">
          <div className="quantity-control" aria-label={`Quantity for ${product.name}`}>
            <button type="button" onClick={() => onDraft({ ...draft, quantity: Math.max(1, draft.quantity - 1) })} aria-label="Decrease quantity">−</button>
            <span>{draft.quantity}</span>
            <button type="button" onClick={() => onDraft({ ...draft, quantity: Math.min(20, draft.quantity + 1) })} aria-label="Increase quantity">+</button>
          </div>
          <button type="button" className="add-button" onClick={onAdd}>{selected ? "Update" : "Add to order"}</button>
        </div>
      </div>
    </article>
  );
}

export function OrderPortal({ products }: { products: Product[] }) {
  const [form, setForm] = useState<FormState>(initialForm);
  const [drafts, setDrafts] = useState<Record<string, ProductDraft>>(() => productDrafts(products));
  const [selected, setSelected] = useState<SelectedItem[]>([]);
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const selectedDetailed = useMemo(() => selected.map((item) => ({
    ...item,
    product: products.find((product) => product.id === item.productId)!
  })), [selected]);

  const subtotal = selectedDetailed.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const itemCount = selected.reduce((sum, item) => sum + item.quantity, 0);

  function patchForm<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function addProduct(productId: string) {
    const draft = drafts[productId];
    setSelected((current) => {
      const next = current.filter((item) => item.productId !== productId);
      return [...next, { productId, size: draft.size, quantity: draft.quantity }];
    });
  }

  function removeProduct(productId: string) {
    setSelected((current) => current.filter((item) => item.productId !== productId));
  }

  async function submitOrder(event: React.FormEvent) {
    event.preventDefault();
    setMessage("");
    if (!selected.length) {
      setStatus("error");
      setMessage("Please add at least one uniform item before submitting your request.");
      return;
    }

    setStatus("submitting");
    try {
      const response = await fetch("/api/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, items: selected })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result?.message || "Unable to submit your order request.");
      setStatus("success");
      setMessage("Your order request has been sent. Wagner Atelier will contact you to confirm the next steps.");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Unable to submit your order request.");
    }
  }

  const required = products.filter((product) => product.category === "required");
  const optional = products.filter((product) => product.category === "optional");

  return (
    <main className="page-shell">
      <header className="site-header">
        <div className="brand-lockup">
          <div className="crest">RA</div>
          <div>
            <strong>{portalConfig.schoolName}</strong>
            <span>{portalConfig.schoolTagline}</span>
          </div>
        </div>
        <nav aria-label="Primary navigation">
          <a href="#catalogue" className="active">Catalogue</a>
          <a href="#order-summary">My selections <span className="nav-badge">{itemCount}</span></a>
          <a href="mailto:orders@wagneratelier.co">Help</a>
        </nav>
        <div className="header-note">Uniform ordering by <strong>{portalConfig.contactBrand}</strong></div>
      </header>

      <div className="content-grid">
        <section className="main-column">
          <div className="intro">
            <span className="eyebrow">Private school ordering portal</span>
            <h1>School Uniform Order</h1>
            <p>Select the items, sizes and quantities you need. No online payment is required; your request is sent directly to Wagner Atelier for confirmation.</p>
          </div>

          <form id="order-form" onSubmit={submitOrder}>
            <label className="honeypot" aria-hidden="true">Website<input tabIndex={-1} autoComplete="off" value={form.website} onChange={(e) => patchForm("website", e.target.value)} /></label>
            <section className="form-card" aria-labelledby="details-title">
              <div className="section-heading compact">
                <div>
                  <span className="section-index">01</span>
                  <h2 id="details-title">Student & parent details</h2>
                </div>
                <p>Required fields are marked with an asterisk.</p>
              </div>

              <div className="form-grid">
                <label className="field field-wide-mobile">
                  <span>Student name *</span>
                  <input required value={form.studentName} onChange={(e) => patchForm("studentName", e.target.value)} placeholder="Full name" autoComplete="off" />
                </label>
                <label className="field">
                  <span>Grade *</span>
                  <select required value={form.grade} onChange={(e) => patchForm("grade", e.target.value)}>
                    <option value="">Select grade</option>
                    {portalConfig.grades.map((grade) => <option key={grade}>{grade}</option>)}
                  </select>
                </label>
                <label className="field">
                  <span>Parent / guardian name *</span>
                  <input required value={form.parentName} onChange={(e) => patchForm("parentName", e.target.value)} placeholder="Full name" autoComplete="name" />
                </label>
                <label className="field">
                  <span>Email *</span>
                  <input required type="email" value={form.email} onChange={(e) => patchForm("email", e.target.value)} placeholder="name@example.com" autoComplete="email" />
                </label>
                <label className="field">
                  <span>Phone *</span>
                  <input required value={form.phone} onChange={(e) => patchForm("phone", e.target.value)} placeholder="+90 ..." autoComplete="tel" />
                </label>
                <fieldset className="measurement-fields">
                  <legend>Optional measurements <span>cm</span></legend>
                  <label><span>Height</span><input inputMode="decimal" value={form.height} onChange={(e) => patchForm("height", e.target.value)} placeholder="—" /></label>
                  <label><span>Chest</span><input inputMode="decimal" value={form.chest} onChange={(e) => patchForm("chest", e.target.value)} placeholder="—" /></label>
                  <label><span>Waist</span><input inputMode="decimal" value={form.waist} onChange={(e) => patchForm("waist", e.target.value)} placeholder="—" /></label>
                </fieldset>
              </div>
            </section>

            <section id="catalogue" className="catalogue-section">
              <div className="section-heading">
                <div>
                  <span className="section-index">02</span>
                  <h2>Required items</h2>
                </div>
                <p>Core pieces from the school uniform.</p>
              </div>
              <div className="product-grid">
                {required.map((product) => <ProductCard key={product.id} product={product} draft={drafts[product.id]} selected={selected.find((item) => item.productId === product.id)} onDraft={(draft) => setDrafts((current) => ({ ...current, [product.id]: draft }))} onAdd={() => addProduct(product.id)} />)}
              </div>
            </section>

            <section className="catalogue-section">
              <div className="section-heading">
                <div>
                  <span className="section-index">03</span>
                  <h2>Optional items</h2>
                </div>
                <p>Add only what your child needs.</p>
              </div>
              <div className="product-grid optional-grid">
                {optional.map((product) => <ProductCard key={product.id} product={product} draft={drafts[product.id]} selected={selected.find((item) => item.productId === product.id)} onDraft={(draft) => setDrafts((current) => ({ ...current, [product.id]: draft }))} onAdd={() => addProduct(product.id)} />)}
              </div>
            </section>

            <section className="notes-card">
              <label className="field">
                <span>Anything we should know? <small>Optional</small></span>
                <textarea rows={3} value={form.notes} onChange={(e) => patchForm("notes", e.target.value)} placeholder="Special requests, fit notes or questions..." maxLength={1000} />
              </label>
            </section>
          </form>
        </section>

        <aside id="order-summary" className="summary-column" aria-label="Your order request">
          <div className="summary-card">
            <div className="summary-header">
              <div>
                <span className="eyebrow">Your selection</span>
                <h2>Order request</h2>
              </div>
              <span className="count-pill"><CartIcon /> {itemCount}</span>
            </div>

            <div className="student-preview">
              <span className="avatar">{form.studentName.trim().slice(0, 1).toUpperCase() || "S"}</span>
              <div><strong>{form.studentName || "Student name"}</strong><span>{form.grade || "Grade not selected"}</span></div>
            </div>

            <div className="summary-items">
              {selectedDetailed.length ? selectedDetailed.map((item) => (
                <div className="summary-item" key={item.productId}>
                  <Image src={item.product.image} alt="" width={58} height={58} />
                  <div><strong>{item.product.name}</strong><span>Size {item.size} · Qty {item.quantity}</span></div>
                  <div className="summary-item-end">
                    {portalConfig.showPrices ? <strong>{formatMoney(item.product.price * item.quantity)}</strong> : null}
                    <button type="button" onClick={() => removeProduct(item.productId)} aria-label={`Remove ${item.product.name}`}>×</button>
                  </div>
                </div>
              )) : (
                <div className="empty-summary"><CartIcon /><strong>No items yet</strong><span>Choose a size and add products from the catalogue.</span></div>
              )}
            </div>

            {portalConfig.showPrices ? <div className="subtotal"><span>Estimated total</span><strong>{formatMoney(subtotal)}</strong></div> : null}

            <div className="payment-note">
              <InfoIcon />
              <div><strong>No online payment.</strong><p>This is an order request only. Wagner Atelier will contact you to confirm payment and collection or delivery details.</p></div>
            </div>

            {message ? <div className={`status-message ${status}`}>{status === "success" ? <CheckIcon /> : <InfoIcon />}<span>{message}</span></div> : null}

            <button className="submit-button" type="submit" form="order-form" disabled={status === "submitting" || status === "success"}>
              <MailIcon />
              {status === "submitting" ? "Sending request…" : status === "success" ? "Request sent" : "Submit order request"}
              {status === "idle" || status === "error" ? <ArrowIcon className="button-arrow" /> : null}
            </button>
            <p className="summary-footnote">Your request is sent securely by e-mail to {portalConfig.contactBrand}. No account is required.</p>
          </div>
        </aside>
      </div>
    </main>
  );
}
