import { apiRequest } from "@/lib/api";

interface AssignProductIdentification {
  product_id: number;
  type: "RFID_UHF";
  value: string;
}

export const productIdentificationsService = {
  create: (token: string, body: AssignProductIdentification, signal?: AbortSignal) =>
    apiRequest<unknown>("/product-identifications", token, { method: "POST", body, signal }),
};
