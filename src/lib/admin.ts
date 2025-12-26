"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export const ORIGINAL_ADMIN_ID = "google-oauth2|101765812180352599429";

export function useAdmin() {
  const isAdmin = useQuery(api.admin.checkAdmin);
  return {
    isAdmin: isAdmin === true,
    isLoading: isAdmin === undefined,
  };
}
