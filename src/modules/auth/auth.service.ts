import type { AuthUserResponse } from "./auth.types";

export class AuthServiceError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "AuthServiceError";
    this.status = status;
  }
}

export const authService = {
  async getAuth(token: string, signal?: AbortSignal): Promise<AuthUserResponse> {
    if (!token.trim()) {
      throw new AuthServiceError("Authorization bearer token is required", 401);
    }

    const baseUrl = (import.meta.env?.VITE_API_URL ?? "").replace(/\/+$/, "");
    console.log("[GET /auth/me] Token de Clerk:", token);
    const response = await fetch(`${baseUrl}/auth/me`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
      signal,
    });

    if (!response.ok) {
      const error: unknown = await response.json().catch(() => null);
      const message =
        error && typeof error === "object" && "message" in error && typeof error.message === "string"
          ? error.message
          : "No se pudo validar tu cuenta. Intentá de nuevo.";

      throw new AuthServiceError(message, response.status);
    }

    return response.json();
  },
};
