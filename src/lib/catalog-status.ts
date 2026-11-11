import { ApiError } from "./api.ts";
import type { Status } from "../modules/products/products.types";

export function normalizeCatalogItem<T extends { status: string }>(item: T): Omit<T, "status"> & { status: Status } {
  const status = item.status.trim().toLowerCase();

  if (status !== "active" && status !== "inactive") {
    throw new ApiError("El servidor devolvió un estado no válido.", 502);
  }

  return { ...item, status };
}
