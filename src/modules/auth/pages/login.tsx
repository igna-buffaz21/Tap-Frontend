import { SignIn, useAuth } from "@clerk/react";
import { Navigate } from "react-router-dom";

import { APP_ROUTES } from "@/config/app.routes";
import { AuthLoading } from "../components/auth-loading";

export default function LoginPage() {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) return <AuthLoading />;
  if (isSignedIn) return <Navigate to={APP_ROUTES.panel.root} replace />;

  return (
    <main className="flex min-h-svh items-center justify-center p-4">
      <SignIn routing="path" path={APP_ROUTES.auth.login} />
    </main>
  );
}
