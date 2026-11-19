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
    } | null;
  }[];
  total: number;
  door: "open" | "closed";
}

export interface SensorState {
  detected: boolean | null;
  confirmed: boolean;
  ready: boolean;
  busy: boolean;
}

export type FlowStage = "opening" | "waitingForObject" | "holding" | "closing" | "reading" | "reopening" | "completed" | "failed";
