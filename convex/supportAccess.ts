import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const HARDCODED_ADMIN_IDS = [
  "google-oauth2|101765812180352599429",
  
];

// User grants temporary support access
export const grantAccess = mutation({
  args: {
    durationHours: v.optional(v.number()),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const hours = args.durationHours || 24;
    const now = Date.now();

    // Revoke any existing active grants
    const existing = await ctx.db
      .query("supportAccess")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .filter((q) => q.and(
        q.gt(q.field("expiresAt"), now),
        q.eq(q.field("revokedAt"), undefined)
      ))
      .collect();

    for (const grant of existing) {
      await ctx.db.patch(grant._id, { revokedAt: now });
    }

    // Create new grant
    await ctx.db.insert("supportAccess", {
      userId: identity.subject,
      grantedAt: now,
      expiresAt: now + hours * 60 * 60 * 1000,
      reason: args.reason,
    });

    return { success: true, expiresIn: hours };
  },
});

// User revokes support access
export const revokeAccess = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const now = Date.now();
    const grants = await ctx.db
      .query("supportAccess")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .filter((q) => q.and(
        q.gt(q.field("expiresAt"), now),
        q.eq(q.field("revokedAt"), undefined)
      ))
      .collect();

    for (const grant of grants) {
      await ctx.db.patch(grant._id, { revokedAt: now });
    }

    return { success: true, revoked: grants.length };
  },
});

// User checks their current access status
export const myAccessStatus = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const now = Date.now();
    const grant = await ctx.db
      .query("supportAccess")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .filter((q) => q.and(
        q.gt(q.field("expiresAt"), now),
        q.eq(q.field("revokedAt"), undefined)
      ))
      .first();

    if (!grant) return { active: false };

    return {
      active: true,
      grantedAt: grant.grantedAt,
      expiresAt: grant.expiresAt,
      reason: grant.reason,
    };
  },
});

// Admin: list users who granted access
export const listGrantedAccess = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity || !HARDCODED_ADMIN_IDS.includes(identity.subject)) {
      return [];
    }

    const now = Date.now();
    const grants = await ctx.db
      .query("supportAccess")
      .filter((q) => q.and(
        q.gt(q.field("expiresAt"), now),
        q.eq(q.field("revokedAt"), undefined)
      ))
      .collect();

    // Get user profiles for each grant
    const results = await Promise.all(
      grants.map(async (grant) => {
        const profile = await ctx.db
          .query("userProfiles")
          .withIndex("by_userId", (q) => q.eq("userId", grant.userId))
          .first();

        return {
          ...grant,
          email: profile?.bio || grant.userId,
          userId: grant.userId,
        };
      })
    );

    return results;
  },
});

// Admin: check if can access specific user
export const canAccessUser = query({
  args: { targetUserId: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity || !HARDCODED_ADMIN_IDS.includes(identity.subject)) {
      return false;
    }

    const now = Date.now();
    const grant = await ctx.db
      .query("supportAccess")
      .withIndex("by_userId", (q) => q.eq("userId", args.targetUserId))
      .filter((q) => q.and(
        q.gt(q.field("expiresAt"), now),
        q.eq(q.field("revokedAt"), undefined)
      ))
      .first();

    return !!grant;
  },
});
