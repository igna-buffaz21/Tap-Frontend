export interface EpcTag {
  epc: string;
  antenna: number;
  rssiRaw: number;
}

export type ReadTagResponse =
  | { found: true; tag: EpcTag }
  | { found: false; tag: null };
