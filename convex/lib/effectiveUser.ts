import { QueryCtx, MutationCtx } from "../_generated/server";

const ADMIN_IDS = ["google-oauth2|101765812180352599429"];

export async function getEffectiveUserId(
  ctx: QueryCtx | MutationCtx,
  asUserId?: string
): Promise<string | null> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;

  // If no impersonation requested, return real user
  if (!asUserId) return identity.subject;

  // Only admins can impersonate
  if (!ADMIN_IDS.includes(identity.subject)) return identity.subject;

  // Check for valid support access grant
  const now = Date.now();
  const grant = await ctx.db
    .query("supportAccess")
    .withIndex("by_userId", (q) => q.eq("userId", asUserId))
    .filter((q) =>
      q.and(
        q.gt(q.field("expiresAt"), now),
        q.eq(q.field("revokedAt"), undefined)
      )
    )
    .first();

  return grant ? asUserId : identity.subject;
}
