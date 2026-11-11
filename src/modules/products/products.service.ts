import { apiRequest } from "@/lib/api";
import { normalizeCatalogItem } from "@/lib/catalog-status";
import type { CreateProduct, Product, Status, UpdateProduct } from "./products.types";

type ProductResponse = Omit<Product, "status"> & { status: string };

export const productsService = {
  list: async (token: string, signal?: AbortSignal) => (await apiRequest<ProductResponse[]>("/products", token, { signal })).map(normalizeCatalogItem),
  create: (token: string, body: CreateProduct) => apiRequest<ProductResponse>("/products", token, { method: "POST", body }).then(normalizeCatalogItem),
  update: (token: string, id: number, body: UpdateProduct) => apiRequest<ProductResponse>(`/products/${id}`, token, { method: "PATCH", body }).then(normalizeCatalogItem),
  setStatus: (token: string, id: number, status: Status) => apiRequest<ProductResponse>(`/products/${id}/status`, token, { method: "PATCH", body: { status } }).then(normalizeCatalogItem),
};
