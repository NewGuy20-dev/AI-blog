import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

function generateKey(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let key = "";
  for (let i = 0; i < 32; i++) {
    key += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return key;
}

export const initializeKey = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("botActionKey").first();
    if (existing) return { key: existing.key, alreadyExists: true };
    
    const key = generateKey();
    await ctx.db.insert("botActionKey", { key, createdAt: Date.now() });
    return { key, alreadyExists: false };
  },
});

export const getKey = query({
  args: {},
  handler: async (ctx) => {
    const keyDoc = await ctx.db.query("botActionKey").first();
    return keyDoc?.key ?? null;
  },
});

export const validateAndRotateKey = mutation({
  args: { key: v.string(), usedBy: v.string() },
  handler: async (ctx, args) => {
    const keyDoc = await ctx.db.query("botActionKey").first();
    if (!keyDoc || keyDoc.key !== args.key) {
      return { valid: false, newKey: null };
    }
    
    const newKey = generateKey();
    await ctx.db.patch(keyDoc._id, {
      key: newKey,
      usedAt: Date.now(),
      usedBy: args.usedBy,
    });
    
    return { valid: true, newKey };
  },
});

export const checkRateLimit = query({
  args: { discordUserId: v.string() },
  handler: async (ctx, args) => {
    const record = await ctx.db
      .query("botRateLimit")
      .withIndex("by_discordUserId", (q) => q.eq("discordUserId", args.discordUserId))
      .first();
    
    if (!record) return { allowed: true, remaining: 10 };
    
    const oneMinuteAgo = Date.now() - 60000;
    const recentRequests = record.timestamps.filter((t) => t > oneMinuteAgo);
    const allowed = recentRequests.length < 10;
    
    return { allowed, remaining: Math.max(0, 10 - recentRequests.length) };
  },
});

export const recordRequest = mutation({
  args: { discordUserId: v.string() },
  handler: async (ctx, args) => {
    const record = await ctx.db
      .query("botRateLimit")
      .withIndex("by_discordUserId", (q) => q.eq("discordUserId", args.discordUserId))
      .first();
    
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    
    if (record) {
      const recentTimestamps = record.timestamps.filter((t) => t > oneMinuteAgo);
      await ctx.db.patch(record._id, { timestamps: [...recentTimestamps, now] });
    } else {
      await ctx.db.insert("botRateLimit", { discordUserId: args.discordUserId, timestamps: [now] });
    }
  },
});
