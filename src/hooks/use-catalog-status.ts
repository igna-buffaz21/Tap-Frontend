import { useAuth } from "@clerk/react";
import { useState } from "react";
import { errorMessage } from "@/lib/api";
import type { Status } from "@/modules/products/products.types";

export function useCatalogStatus<T extends { id: number; status: Status }>(
  update: (token: string, id: number, status: Status) => Promise<T>,
  onUpdated: (item: T) => void,
) {
  const { getToken } = useAuth();
  const [pendingId, setPendingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  async function changeStatus(item: T) {
    if (pendingId !== null) return;
    setPendingId(item.id);
    setError(null);
    setMessage("");
    try {
      const token = await getToken();
      const updated = await update(token ?? "", item.id, item.status === "active" ? "inactive" : "active");
      onUpdated(updated);
      setMessage("Estado actualizado.");
    } catch (error) { setError(errorMessage(error)); }
    finally { setPendingId(null); }
  }

  return { pendingId, error, message, changeStatus };
}
