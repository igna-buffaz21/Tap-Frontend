import { ApiError } from "@/lib/api";
import type { FlowStage, SensorState } from "./esp32.types.ts";

export type Esp32Event =
  | { type: "sensor"; data: SensorState }
  | { type: "flow"; data: { stage: FlowStage } }
  | { type: "hardwareError"; data: { message: string } };

// Read lines incrementally: both UTF-8 characters and CRLF may span chunks.
export async function readSensorEvents(token: string, signal: AbortSignal, onEvent: (event: Esp32Event) => void, onOpen?: () => void) {
  if (!token.trim()) throw new ApiError("Tu sesión venció. Volvé a iniciar sesión.", 401);
  const baseUrl = (import.meta.env?.VITE_API_URL ?? "").replace(/\/+$/, "");
  const response = await fetch(`${baseUrl}/esp32/sensor/events`, {
    headers: { Authorization: `Bearer ${token}`, Accept: "text/event-stream" },
    cache: "no-store",
    signal,
  });
  if (!response.ok) throw new ApiError("No se pudo conectar con el sensor.", response.status);
  if (!response.body) throw new Error("El stream del sensor no está disponible.");
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let type = "message";
  let data: string[] = [];
  onOpen?.();
  function line(value: string) {
    if (!value) {
      if (data.length && ["sensor", "flow", "hardwareError"].includes(type)) {
        onEvent({ type, data: JSON.parse(data.join("\n")) } as Esp32Event);
      }
      type = "message";
      data = [];
    } else if (value.startsWith("event:")) type = value.slice(6).trim();
    else if (value.startsWith("data:")) data.push(value.slice(5).replace(/^ /, ""));
  }
  try {
    while (!signal.aborted) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let end: number;
      while ((end = buffer.indexOf("\n")) !== -1) {
        line(buffer.slice(0, end).replace(/\r$/, ""));
        buffer = buffer.slice(end + 1);
      }
    }
  } finally {
    await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}
