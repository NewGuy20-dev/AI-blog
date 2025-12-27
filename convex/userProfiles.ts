import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getEffectiveUserId } from "./lib/effectiveUser";

export const get = query({
  args: { asUserId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const userId = await getEffectiveUserId(ctx, args.asUserId);
    if (!userId) return null;

    return await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
  },
});

export const upsert = mutation({
  args: {
    bio: v.optional(v.string()),
    website: v.optional(v.string()),
    twitter: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    asUserId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getEffectiveUserId(ctx, args.asUserId);
    if (!userId) throw new Error("Not authenticated");

    const { asUserId: _, ...data } = args;
    const existing = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    const now = Date.now();

    if (existing) {
      await ctx.db.patch(existing._id, { ...data, updatedAt: now });
      return existing._id;
    }

    return await ctx.db.insert("userProfiles", {
      userId,
      ...data,
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
    asUserId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getEffectiveUserId(ctx, args.asUserId);
    if (!userId) throw new Error("Not authenticated");

    const { asUserId: _, ...preferences } = args;
    const existing = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    const now = Date.now();

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
  args: { asUserId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const userId = await getEffectiveUserId(ctx, args.asUserId);
    if (!userId) return;

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
