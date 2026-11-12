import { apiRequest, ApiError } from "@/lib/api";
import type { ReadTagResponse, RunFlowResponse } from "./esp32.types";

export const esp32Service = {
  async runFlow(token: string, signal?: AbortSignal): Promise<RunFlowResponse> {
    try {
      return await apiRequest<RunFlowResponse>("/esp32/run-flow", token, {
        method: "POST",
        signal,
      });
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        throw new ApiError("El lector está ocupado. Esperá unos segundos y volvé a intentar.", 409);
      }
      if (error instanceof ApiError && error.status === 503) {
        throw new ApiError("No se pudo completar el recorrido. Revisá la conexión del ESP32 y volvé a intentar.", 503);
      }
      throw error;
    }
  },
  async readTag(token: string, signal?: AbortSignal): Promise<ReadTagResponse> {
    try {
      return await apiRequest<ReadTagResponse>("/esp32/read-tag", token, {
        method: "POST",
        signal,
      });
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        throw new ApiError("El lector está ocupado. Esperá unos segundos y volvé a intentar.", 409);
      }
      if (error instanceof ApiError && error.status === 503) {
        throw new ApiError("No se pudo realizar la lectura. Revisá la conexión del ESP32 y volvé a intentar.", 503);
      }
      throw error;
    }
  },
};
