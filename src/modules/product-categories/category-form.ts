import type { ProductCategory, UpdateProductCategory } from "./product-categories.types";

export function categoryChanges(name: string, description: string, original: ProductCategory): UpdateProductCategory {
  return {
    ...(name.trim() !== original.name ? { name: name.trim() } : {}),
    ...(description.trim() !== (original.description ?? "") ? { description: description.trim() } : {}),
  };
}
