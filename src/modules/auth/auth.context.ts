import { createContext, useContext } from "react";

import type { AuthUserResponse } from "./auth.types";

export const AuthUserContext = createContext<AuthUserResponse | null>(null);

export function useAuthUser() {
  const user = useContext(AuthUserContext);

  if (!user) throw new Error("useAuthUser requiere una cuenta validada por el backend.");

  return user;
}
