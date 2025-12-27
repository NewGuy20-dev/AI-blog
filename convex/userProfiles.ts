import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const get = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    return await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .first();
  },
});

export const upsert = mutation({
  args: {
    bio: v.optional(v.string()),
    website: v.optional(v.string()),
    twitter: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const userId = identity.subject;
    const existing = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    const now = Date.now();

    if (existing) {
      await ctx.db.patch(existing._id, {
        ...args,
        updatedAt: now,
      });
      return existing._id;
    }

    return await ctx.db.insert("userProfiles", {
      userId,
      ...args,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updatePreferences = mutation({
  args: {
    theme: v.optional(v.string()),
    accentColor: v.optional(v.string()),
    fontSize: v.optional(v.string()),
    reducedMotion: v.optional(v.boolean()),
    emailDigest: v.optional(v.string()),
    pushNotifications: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const userId = identity.subject;
    const existing = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    const now = Date.now();
    const preferences = { ...args };

    if (existing) {
      await ctx.db.patch(existing._id, {
        preferences: { ...existing.preferences, ...preferences },
        updatedAt: now,
      });
      return existing._id;
    }

    return await ctx.db.insert("userProfiles", {
      userId,
      preferences,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const incrementArticlesRead = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return;

    const userId = identity.subject;
    const existing = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    const now = Date.now();

    if (existing) {
      const currentStats = existing.stats || {};
      await ctx.db.patch(existing._id, {
        stats: {
          ...currentStats,
          articlesRead: (currentStats.articlesRead || 0) + 1,
          lastActive: now,
        },
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("userProfiles", {
        userId,
        stats: { articlesRead: 1, lastActive: now },
        createdAt: now,
        updatedAt: now,
      });
    }
  },
});


// Admin: get user profile by userId (requires support access)
export const getByUserId = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    // Check if admin has support access to this user
    const HARDCODED_ADMIN_IDS = [
      "google-oauth2|101765812180352599429",
      "google-oauth2|103430903957817165722",
    ];
    
    if (!HARDCODED_ADMIN_IDS.includes(identity.subject)) {
      return null;
    }

    const now = Date.now();
    const grant = await ctx.db
      .query("supportAccess")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .filter((q) => q.and(
        q.gt(q.field("expiresAt"), now),
        q.eq(q.field("revokedAt"), undefined)
      ))
      .first();

    if (!grant) return null;

    return await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();
  },
});
