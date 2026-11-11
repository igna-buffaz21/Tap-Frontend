export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export async function apiRequest<T>(path: string, token: string, options: {
  method?: "GET" | "POST" | "PATCH";
  body?: unknown;
  signal?: AbortSignal;
} = {}): Promise<T> {
  if (!token.trim()) throw new ApiError("Tu sesión venció. Volvé a iniciar sesión.", 401);
  const method = options.method ?? "GET";
  const baseUrl = (import.meta.env?.VITE_API_URL ?? "").replace(/\/+$/, "");
  console.log(`[${method} ${path}] Token de Clerk:`, token);
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(options.body !== undefined ? { "Content-Type": "application/json" } : {}),
    },
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    signal: options.signal,
    cache: "no-store",
  });
  if (!response.ok) {
    const data: unknown = await response.json().catch(() => null);
    let message = "No se pudo completar la operación. Intentá de nuevo.";
    if (data && typeof data === "object" && "message" in data) {
      if (typeof data.message === "string") message = data.message;
      if (Array.isArray(data.message)) message = data.message.filter((item) => typeof item === "string").join(". ") || message;
    }
    if (response.status === 401) message = "No se pudo validar tu sesión. Volvé a iniciar sesión.";
    throw new ApiError(message, response.status);
  }
  return response.json();
}

export function errorMessage(error: unknown) {
  return error instanceof ApiError ? error.message : "No pudimos conectar con el servidor. Intentá de nuevo.";
}
