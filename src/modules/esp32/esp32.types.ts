export interface EpcTag {
  epc: string;
  antenna: number;
  rssiRaw: number;
}

export type ReadTagResponse =
  | { found: true; tag: EpcTag }
  | { found: false; tag: null };

export interface RunFlowResponse {
  products: {
    epc: string;
    product: {
      id: string;
      name: string;
      sale_price: string;
    };
  }[];
  total: number;
  door: "open" | "closed";
}
