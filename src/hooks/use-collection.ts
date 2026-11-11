import { useAuth } from "@clerk/react";
import { useEffect, useState } from "react";
import { errorMessage } from "@/lib/api";

export function useCollection<T extends { id: number; name: string }>(list: (token: string, signal?: AbortSignal) => Promise<T[]>) {
  const { getToken } = useAuth();
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const token = await getToken();
        if (controller.signal.aborted) return;
        const result = await list(token ?? "", controller.signal);
        if (!controller.signal.aborted) {
          setItems(result);
          setError(null);
        }
      } catch (error) {
        if (!controller.signal.aborted) setError(errorMessage(error));
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void load();
    return () => controller.abort();
  }, [getToken, list, revision]);

  function reload() {
    setLoading(true);
    setError(null);
    setRevision((value) => value + 1);
  }

  function upsert(item: T) {
    setItems((current) => [...current.filter((row) => row.id !== item.id), item].sort((a, b) => a.name.localeCompare(b.name, "es")));
  }

  return { items, loading, error, reload, upsert };
}
