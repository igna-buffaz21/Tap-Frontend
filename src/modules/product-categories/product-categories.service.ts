import { apiRequest } from "@/lib/api";
import { normalizeCatalogItem } from "@/lib/catalog-status";
import type { Status } from "../products/products.types";
import type { CreateProductCategory, ProductCategory, UpdateProductCategory } from "./product-categories.types";

type CategoryResponse = Omit<ProductCategory, "status"> & { status: string };

export const productCategoriesService = {
  list: async (token: string, signal?: AbortSignal) => (await apiRequest<CategoryResponse[]>("/product-categories", token, { signal })).map(normalizeCatalogItem),
  create: (token: string, body: CreateProductCategory) => apiRequest<CategoryResponse>("/product-categories", token, { method: "POST", body }).then(normalizeCatalogItem),
  update: (token: string, id: number, body: UpdateProductCategory) => apiRequest<CategoryResponse>(`/product-categories/${id}`, token, { method: "PATCH", body }).then(normalizeCatalogItem),
  setStatus: (token: string, id: number, status: Status) => apiRequest<CategoryResponse>(`/product-categories/${id}/status`, token, { method: "PATCH", body: { status } }).then(normalizeCatalogItem),
};
