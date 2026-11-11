import type { CreateProduct, Product, ProductUnit, Status, UpdateProduct } from "./products.types";

export interface ProductDraft {
  name: string; description: string; sku: string; category: string; unit: ProductUnit;
  cost: string; price: string; branch: string; minimum: string; status: Status;
}

export function productDraft(product?: Product): ProductDraft {
  return {
    name: product?.name ?? "", description: product?.description ?? "", sku: product?.sku ?? "",
    category: product?.category_id != null ? String(product.category_id) : "none",
    unit: product?.unit ?? "unit", cost: product?.cost_price != null ? String(product.cost_price) : "",
    price: product?.sale_price != null ? String(product.sale_price) : "", branch: "", minimum: "", status: "active",
  };
}

function editableValues(draft: ProductDraft) {
  return {
    name: draft.name.trim(), description: draft.description.trim() || null, sku: draft.sku.trim() || null,
    category_id: draft.category === "none" ? null : Number(draft.category), unit: draft.unit,
    cost_price: draft.cost === "" ? null : Number(draft.cost), sale_price: draft.price === "" ? null : Number(draft.price),
  };
}

export function productChanges(draft: ProductDraft, product: Product): UpdateProduct {
  const values = editableValues(draft);
  const original = editableValues(productDraft(product));
  return Object.fromEntries(Object.entries(values).filter(([key, value]) => value !== original[key as keyof typeof original]));
}

export function productCreatePayload(draft: ProductDraft): CreateProduct {
  return {
    ...editableValues(draft), status: draft.status,
    ...(draft.branch !== "" ? { branch_id: Number(draft.branch), ...(draft.minimum !== "" ? { minimum_quantity: Number(draft.minimum) } : {}) } : {}),
  };
}
