import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const HARDCODED_ADMIN_IDS = ["google-oauth2|101765812180352599429"];
const MAX_ACCOUNTS_PER_DEVICE = 2;

// Track a fingerprint
export const track = mutation({
  args: {
    visitorId: v.string(),
    userId: v.optional(v.string()),
    ip: v.optional(v.string()),
    userAgent: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const existing = await ctx.db
      .query("fingerprints")
      .withIndex("by_visitorId", (q) => q.eq("visitorId", args.visitorId))
      .first();

    if (existing) {
      // Track unique user IDs for this fingerprint
      let userIds: string[] = (existing as any).userIds || [];
      if (args.userId && !userIds.includes(args.userId)) {
        userIds = [...userIds, args.userId];
      }

      // Auto-ban if more than MAX_ACCOUNTS_PER_DEVICE accounts
      const shouldAutoBan = !existing.banned && userIds.length > MAX_ACCOUNTS_PER_DEVICE;

      await ctx.db.patch(existing._id, {
        lastSeen: now,
        userId: args.userId || existing.userId,
        ip: args.ip || existing.ip,
        userAgent: args.userAgent || existing.userAgent,
        userIds,
        ...(shouldAutoBan ? {
          banned: true,
          banReason: `Auto-banned: ${userIds.length} accounts detected on same device`,
          bannedAt: now,
          autoBanned: true,
        } : {}),
      });

      return { 
        banned: existing.banned || shouldAutoBan, 
        reason: shouldAutoBan ? `Multiple accounts detected (${userIds.length})` : existing.banReason,
        autoBanned: shouldAutoBan,
      };
    }

    // New fingerprint
    const userIds = args.userId ? [args.userId] : [];
    await ctx.db.insert("fingerprints", {
      visitorId: args.visitorId,
      userId: args.userId,
      ip: args.ip,
      userAgent: args.userAgent,
      firstSeen: now,
      lastSeen: now,
      userIds,
    });

    return { banned: false };
  },
});

// Check if fingerprint is banned
export const isBanned = query({
  args: { visitorId: v.string() },
  handler: async (ctx, args) => {
    const fp = await ctx.db
      .query("fingerprints")
      .withIndex("by_visitorId", (q) => q.eq("visitorId", args.visitorId))
      .first();

    if (!fp) return { banned: false };
    return { banned: !!fp.banned, reason: fp.banReason };
  },
});

// Admin: ban a fingerprint
export const ban = mutation({
  args: { visitorId: v.string(), reason: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity || !HARDCODED_ADMIN_IDS.includes(identity.subject)) {
      throw new Error("Not authorized");
    }

    const fp = await ctx.db
      .query("fingerprints")
      .withIndex("by_visitorId", (q) => q.eq("visitorId", args.visitorId))
      .first();

    if (!fp) return { success: false, message: "Fingerprint not found" };

    await ctx.db.patch(fp._id, {
      banned: true,
      banReason: args.reason,
      bannedAt: Date.now(),
    });

    return { success: true };
  },
});

// Admin: unban a fingerprint
export const unban = mutation({
  args: { visitorId: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity || !HARDCODED_ADMIN_IDS.includes(identity.subject)) {
      throw new Error("Not authorized");
    }

    const fp = await ctx.db
      .query("fingerprints")
      .withIndex("by_visitorId", (q) => q.eq("visitorId", args.visitorId))
      .first();

    if (!fp) return { success: false, message: "Fingerprint not found" };

    await ctx.db.patch(fp._id, {
      banned: false,
      banReason: undefined,
      bannedAt: undefined,
    });

    return { success: true };
  },
});

// Admin: list all fingerprints
export const list = query({
  args: { bannedOnly: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity || !HARDCODED_ADMIN_IDS.includes(identity.subject)) {
      return [];
    }

    if (args.bannedOnly) {
      return await ctx.db
        .query("fingerprints")
        .withIndex("by_banned", (q) => q.eq("banned", true))
        .collect();
    }

    return await ctx.db.query("fingerprints").order("desc").take(100);
  },
});

// Get fingerprints by user ID
export const getByUserId = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity || !HARDCODED_ADMIN_IDS.includes(identity.subject)) {
      return [];
    }

    return await ctx.db
      .query("fingerprints")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();
  },
});
