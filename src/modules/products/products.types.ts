export type Status = "active" | "inactive";
export type ProductUnit = "unit" | "kg" | "g" | "l" | "ml" | "box" | "pack";

export interface Product {
  id: number;
  business_id: number;
  category_id: number | null;
  name: string;
  description: string | null;
  sku: string | null;
  unit: ProductUnit;
  cost_price: number | null;
  sale_price: number | null;
  status: Status;
  created_at: string;
  updated_at: string;
}

export interface CreateProduct {
  name: string;
  category_id?: number | null;
  description?: string | null;
  sku?: string | null;
  unit?: ProductUnit;
  cost_price?: number | null;
  sale_price?: number | null;
  branch_id?: number;
  minimum_quantity?: number;
  status?: Status;
}

export type UpdateProduct = Partial<Omit<CreateProduct, "branch_id" | "minimum_quantity" | "status">>;
