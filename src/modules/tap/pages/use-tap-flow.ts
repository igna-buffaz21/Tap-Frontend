import { useEffect, useState } from "react";
import { ApiError, errorMessage } from "@/lib/api";
import { readSensorEvents } from "@/modules/esp32/esp32.events";
import { esp32Service } from "@/modules/esp32/esp32.service";
import type { FlowStage, RunFlowResponse, SensorState } from "@/modules/esp32/esp32.types";

export function useTapFlow(enabled: boolean, getToken: () => Promise<string | null>) {
  const [sensor, setSensor] = useState<SensorState | null>(null);
  const [stage, setStage] = useState<FlowStage | null>(null);
  const [reading, setReading] = useState(false);
  const [result, setResult] = useState<RunFlowResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [connection, setConnection] = useState("Conectando con el sensor");
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    if (stage !== "holding") return;
    const until = Date.now() + 3000;
    const timer = setInterval(() => setCountdown(Math.max(0, Math.ceil((until - Date.now()) / 1000))), 100);
    return () => clearInterval(timer);
  }, [stage]);

  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    const { signal } = controller;
    let running = false;
    let consumed = false;
    let latest: SensorState | null = null;

    async function run() {
      if (signal.aborted || running || consumed || !latest?.ready || latest.busy) return;
      consumed = true;
      running = true;
      setReading(true);
      setResult(null);
      setError(null);
      setStage(null);
      let succeeded = false;
      try {
        const token = await getToken();
        if (signal.aborted) return;
        const response = await esp32Service.runFlow(token ?? "", signal);
        succeeded = true;
        if (!signal.aborted) setResult(response);
      } catch (error) {
        if (!signal.aborted) {
          setError(errorMessage(error));
          setStage("failed");
        }
      } finally {
        running = false;
        if (!signal.aborted) {
          setReading(false);
          if (succeeded) void run();
        }
      }
    }

    async function connect() {
      let failures = 0;
      while (!signal.aborted) {
        try {
          const token = await getToken();
          if (signal.aborted) return;
          await readSensorEvents(token ?? "", signal, (event) => {
            if (signal.aborted) return;
            if (event.type === "sensor") {
              latest = event.data;
              setSensor(latest);
              if (latest.detected === false) consumed = false;
              void run();
            } else if (event.type === "flow") {
              if (event.data.stage === "holding") setCountdown(3);
              setStage(event.data.stage);
            } else {
              throw new ApiError(event.data.message, 503);
            }
          }, () => {
            failures = 0;
            setConnection("Sensor conectado");
          });
        } catch (error) {
          if (signal.aborted) return;
          if (error instanceof ApiError) {
            setError(errorMessage(error));
            if (error.status === 401 || error.status === 403) {
              setConnection("Revisá tu sesión y permisos");
              return;
            }
          }
        }
        if (signal.aborted) return;
        latest = null;
        setConnection("Conexión interrumpida · Reconectando");
        const delay = Math.min(1000 * 2 ** failures++, 15000);
        await new Promise<void>((resolve) => {
          const done = () => { clearTimeout(timer); signal.removeEventListener("abort", done); resolve(); };
          const timer = setTimeout(done, delay);
          signal.addEventListener("abort", done, { once: true });
        });
      }
    }
    void connect();
    return () => controller.abort();
  }, [enabled, getToken]);

  return { sensor, stage, reading, result, error, connection, countdown };
}
