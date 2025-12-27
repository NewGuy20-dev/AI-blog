"use client";

import { useUser } from "@auth0/nextjs-auth0/client";
import { useImpersonation } from "@/app/providers";

export function useEffectiveUser() {
  const { user, isLoading } = useUser();
  const { isImpersonating, impersonatedUserId, effectiveUserId } = useImpersonation();

  return {
    // The actual logged-in user
    realUser: user,
    // The user ID to use for data operations
    effectiveUserId,
    // Whether we're impersonating someone
    isImpersonating,
    impersonatedUserId,
    isLoading,
    // Is the real user an admin
    isAdmin: user?.sub === "google-oauth2|101765812180352599429",
  };
}
