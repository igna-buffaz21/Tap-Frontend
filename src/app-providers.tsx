import { ClerkProvider } from "@clerk/react";
import { useNavigate } from "react-router-dom";

import App from "./App";
import { TooltipProvider } from "@/components/ui/tooltip";
import { APP_ROUTES } from "@/config/app.routes";

const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!clerkPublishableKey) {
  throw new Error("Falta VITE_CLERK_PUBLISHABLE_KEY en el .env");
}

export function AppProviders() {
  const navigate = useNavigate();

  return (
    <ClerkProvider
      publishableKey={clerkPublishableKey}
      routerPush={(to) => navigate(to)}
      routerReplace={(to) => navigate(to, { replace: true })}
      signInUrl={APP_ROUTES.auth.login}
      signInForceRedirectUrl={APP_ROUTES.panel.root}
      signUpForceRedirectUrl={APP_ROUTES.panel.root}
      afterSignOutUrl={APP_ROUTES.auth.login}
    >
      <TooltipProvider>
        <App />
      </TooltipProvider>
    </ClerkProvider>
  );
}

