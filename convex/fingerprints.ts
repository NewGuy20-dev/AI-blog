import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const HARDCODED_ADMIN_IDS = ["google-oauth2|101765812180352599429"];

interface RiskFactors {
  fingerprintReused: boolean;
  rapidSwitching: boolean;
  sameIpRange: boolean;
  abnormalBehavior: boolean;
  automationSignals: boolean;
}

function calculateRiskScore(factors: RiskFactors): number {
  let score = 0;
  if (factors.fingerprintReused) score += 2;
  if (factors.rapidSwitching) score += 2;
  if (factors.sameIpRange) score += 1;
  if (factors.abnormalBehavior) score += 2;
  if (factors.automationSignals) score += 3;
  return score;
}

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
      // Track unique user IDs and login times
      let userIds: string[] = (existing as any).userIds || [];
      let loginTimes: number[] = (existing as any).loginTimes || [];
      let ipAddresses: string[] = (existing as any).ipAddresses || [];
      
      const isNewUser = args.userId && !userIds.includes(args.userId);
      if (isNewUser && args.userId) {
        userIds = [...userIds, args.userId];
      }
      
      loginTimes = [...loginTimes.slice(-20), now]; // Keep last 20 logins
      
      if (args.ip && !ipAddresses.includes(args.ip)) {
        ipAddresses = [...ipAddresses.slice(-10), args.ip];
      }

      // Calculate risk factors
      const fingerprintReused = userIds.length > 1;
      
      // Rapid switching: 3+ logins in 5 minutes
      const recentLogins = loginTimes.filter(t => now - t < 5 * 60 * 1000);
      const rapidSwitching = recentLogins.length >= 3;
      
      // Same IP range: check if IPs share first 3 octets
      const ipPrefixes = ipAddresses.map(ip => ip.split('.').slice(0, 3).join('.'));
      const sameIpRange = new Set(ipPrefixes).size < ipAddresses.length && ipAddresses.length > 1;
      
      // Abnormal behavior: many accounts (4+)
      const abnormalBehavior = userIds.length >= 4;
      
      // Automation signals: very rapid requests (5+ in 10 seconds)
      const veryRecentLogins = loginTimes.filter(t => now - t < 10 * 1000);
      const automationSignals = veryRecentLogins.length >= 5;

      const riskScore = calculateRiskScore({
        fingerprintReused,
        rapidSwitching,
        sameIpRange,
        abnormalBehavior,
        automationSignals,
      });

      // Determine action based on risk score
      let banned = existing.banned;
      let restricted = (existing as any).restricted;
      let banReason = existing.banReason;
      let restrictedUntil = (existing as any).restrictedUntil;

      if (!banned && riskScore >= 8) {
        banned = true;
        banReason = `Auto-banned: Risk score ${riskScore} (${userIds.length} accounts)`;
      } else if (!banned && !restricted && riskScore >= 6) {
        restricted = true;
        restrictedUntil = now + 30 * 60 * 1000; // 30 min restriction
      }

      await ctx.db.patch(existing._id, {
        lastSeen: now,
        userId: args.userId || existing.userId,
        ip: args.ip || existing.ip,
        userAgent: args.userAgent || existing.userAgent,
        userIds,
        loginTimes,
        ipAddresses,
        riskScore,
        ...(banned && !existing.banned ? { banned: true, banReason, bannedAt: now, autoBanned: true } : {}),
        ...(restricted ? { restricted, restrictedUntil } : {}),
      });

      // Check if restriction expired
      if (restricted && restrictedUntil && now > restrictedUntil) {
        restricted = false;
      }

      return { 
        banned,
        restricted,
        restrictedUntil,
        reason: banned ? banReason : restricted ? `Temporary restriction (risk: ${riskScore})` : undefined,
        riskScore,
      };
    }

    // New fingerprint
    const userIds = args.userId ? [args.userId] : [];
    const ipAddresses = args.ip ? [args.ip] : [];
    await ctx.db.insert("fingerprints", {
      visitorId: args.visitorId,
      userId: args.userId,
      ip: args.ip,
      userAgent: args.userAgent,
      firstSeen: now,
      lastSeen: now,
      userIds,
      loginTimes: [now],
      ipAddresses,
      riskScore: 0,
    });

    return { banned: false, restricted: false, riskScore: 0 };
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
