import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const HARDCODED_ADMIN_IDS = [
  "google-oauth2|101765812180352599429",
  "google-oauth2|103430903957817165722",
];

// Check if IP is blocked (public - no auth required)
export const isBlocked = query({
  args: { ip: v.string() },
  handler: async (ctx, args) => {
    const now = Date.now();
    const blocked = await ctx.db
      .query("blockedIps")
      .withIndex("by_ip", (q) => q.eq("ip", args.ip))
      .first();

    if (!blocked) return { blocked: false };
    
    // Check if expired
    if (blocked.expiresAt && blocked.expiresAt < now) {
      return { blocked: false };
    }

    return { blocked: true, reason: blocked.reason };
  },
});

// Admin: block an IP
export const blockIp = mutation({
  args: {
    ip: v.string(),
    reason: v.optional(v.string()),
    durationDays: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity || !HARDCODED_ADMIN_IDS.includes(identity.subject)) {
      throw new Error("Not authorized");
    }

    // Check if already blocked
    const existing = await ctx.db
      .query("blockedIps")
      .withIndex("by_ip", (q) => q.eq("ip", args.ip))
      .first();

    if (existing) {
      return { success: false, message: "IP already blocked" };
    }

    const now = Date.now();
    await ctx.db.insert("blockedIps", {
      ip: args.ip,
      reason: args.reason,
      blockedBy: identity.subject,
      blockedAt: now,
      expiresAt: args.durationDays ? now + args.durationDays * 24 * 60 * 60 * 1000 : undefined,
    });

    return { success: true, message: `Blocked IP: ${args.ip}` };
  },
});

// Admin: unblock an IP
export const unblockIp = mutation({
  args: { ip: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity || !HARDCODED_ADMIN_IDS.includes(identity.subject)) {
      throw new Error("Not authorized");
    }

    const blocked = await ctx.db
      .query("blockedIps")
      .withIndex("by_ip", (q) => q.eq("ip", args.ip))
      .first();

    if (!blocked) {
      return { success: false, message: "IP not found" };
    }

    await ctx.db.delete(blocked._id);
    return { success: true, message: `Unblocked IP: ${args.ip}` };
  },
});

// Admin: list all blocked IPs
export const listBlocked = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity || !HARDCODED_ADMIN_IDS.includes(identity.subject)) {
      return [];
    }

    return await ctx.db.query("blockedIps").order("desc").collect();
  },
});
