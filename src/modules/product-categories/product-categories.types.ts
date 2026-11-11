import type { Status } from "../products/products.types";

export interface ProductCategory {
  id: number;
  business_id: number;
  name: string;
  description: string | null;
  status: Status;
  created_at: string;
  updated_at: string;
}

export interface CreateProductCategory {
  name: string;
  description?: string;
  status?: Status;
}

export type UpdateProductCategory = Partial<Pick<CreateProductCategory, "name" | "description">>;
