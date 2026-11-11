import { useAuth } from "@clerk/react";
import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { APP_ROUTES } from "@/config/app.routes";
import { AuthUserContext } from "../auth.context";
import { authService, AuthServiceError } from "../auth.service";
import type { AuthUserResponse } from "../auth.types";
import { AuthLoading } from "./auth-loading";

type AuthState =
  | { status: "loading" }
  | { status: "ready"; user: AuthUserResponse }
  | { status: "error"; message: string };

function AuthSession() {
  const { getToken, signOut } = useAuth();
  const [state, setState] = useState<AuthState>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function validateUser() {
      try {
        const token = await getToken();
        if (controller.signal.aborted) return;
        if (!token) throw new AuthServiceError("Authorization bearer token is required", 401);

        const user = await authService.getAuth(token, controller.signal);
        if (controller.signal.aborted) return;
        if (user.status !== "active") throw new AuthServiceError("User is not registered", 401);

        setState({ status: "ready", user });
      } catch (error) {
        if (controller.signal.aborted) return;

        const message = error instanceof AuthServiceError && error.status === 401
          ? error.message === "User is not registered"
            ? "Tu cuenta no está registrada o está inactiva."
            : "No se pudo validar tu sesión. Volvé a iniciar sesión."
          : "No pudimos conectar con el servidor. Intentá de nuevo.";

        setState({ status: "error", message });
      }
    }

    void validateUser();
    return () => controller.abort();
  }, [getToken, attempt]);

  if (state.status === "loading") return <AuthLoading />;

  if (state.status === "error") {
    return (
      <main className="flex min-h-svh flex-col items-center justify-center gap-4 p-6">
        <p role="alert" className="text-center text-sm">{state.message}</p>
        <div className="flex gap-2">
          <Button onClick={() => {
            setState({ status: "loading" });
            setAttempt((value) => value + 1);
          }}>Reintentar</Button>
          <Button variant="outline" onClick={() => {
            void signOut().catch(() => {
              setState({ status: "error", message: "No se pudo cerrar la sesión. Intentá de nuevo." });
            });
          }}>Cerrar sesión</Button>
        </div>
      </main>
    );
  }

  return (
    <AuthUserContext.Provider value={state.user}>
      <Outlet />
    </AuthUserContext.Provider>
  );
}

export function ProtectedRoute() {
  const { isLoaded, isSignedIn, sessionId } = useAuth();

  if (!isLoaded) return <AuthLoading />;
  if (!isSignedIn) return <Navigate to={APP_ROUTES.auth.login} replace />;

  return <AuthSession key={sessionId} />;
}
