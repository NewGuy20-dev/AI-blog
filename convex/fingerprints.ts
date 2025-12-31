import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const HARDCODED_ADMIN_IDS = ["google-oauth2|101765812180352599429"];
const BANNED_USER_IDS: string[] = []; // Managed in database

interface RiskFactors {
  fingerprintReused: boolean;
  rapidSwitching: boolean;
  sameIpRange: boolean;
  abnormalBehavior: boolean;
  automationSignals: boolean;
  spoofingDetected: boolean;
  serverFpMismatch: boolean;
}

function calculateRiskScore(factors: RiskFactors): number {
  let score = 0;
  if (factors.fingerprintReused) score += 2;
  if (factors.rapidSwitching) score += 2;
  if (factors.sameIpRange) score += 1;
  if (factors.abnormalBehavior) score += 2;
  if (factors.automationSignals) score += 3;
  if (factors.spoofingDetected) score += 4;
  if (factors.serverFpMismatch) score += 3;
  return score;
}

// Track a fingerprint
export const track = mutation({
  args: {
    visitorId: v.string(),
    userId: v.optional(v.string()),
    ip: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    serverFingerprint: v.optional(v.string()),
    spoofReasons: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    // Check if user is in banned list
    if (args.userId && BANNED_USER_IDS.includes(args.userId)) {
      return { banned: true, restricted: false, reason: "Account banned", riskScore: 10 };
    }

    // Verify JWT if userId provided - but don't block if auth not ready yet
    if (args.userId) {
      const identity = await ctx.auth.getUserIdentity();
      // Only block if we have an identity but it doesn't match (actual spoofing)
      // If identity is null, auth might just not be synced yet - allow through
      if (identity && identity.subject !== args.userId) {
        return { banned: true, restricted: false, reason: "Auth mismatch", riskScore: 10 };
      }
    }

    const now = Date.now();
    const existing = await ctx.db
      .query("fingerprints")
      .withIndex("by_visitorId", (q) => q.eq("visitorId", args.visitorId))
      .first();

    if (existing) {
      // Check server fingerprint mismatch (cookie editor detection)
      const serverFpMismatch = args.serverFingerprint && 
        (existing as any).serverFingerprint && 
        args.serverFingerprint !== (existing as any).serverFingerprint;

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

      // Spoofing detected from server-side checks
      const spoofingDetected = (args.spoofReasons?.length || 0) >= 2;

      const riskScore = calculateRiskScore({
        fingerprintReused,
        rapidSwitching,
        sameIpRange,
        abnormalBehavior,
        automationSignals,
        spoofingDetected,
        serverFpMismatch: !!serverFpMismatch,
      });

      // Determine action based on risk score
      let banned = existing.banned;
      let restricted = (existing as any).restricted;
      let banReason = existing.banReason;
      let restrictedUntil = (existing as any).restrictedUntil;

      // Lower threshold for banning if spoofing detected
      const banThreshold = spoofingDetected || serverFpMismatch ? 5 : 8;
      
      if (!banned && riskScore >= banThreshold) {
        banned = true;
        banReason = spoofingDetected 
          ? `Auto-banned: Spoofing detected (${args.spoofReasons?.join(", ")})`
          : serverFpMismatch
          ? `Auto-banned: Cookie manipulation detected`
          : `Auto-banned: Risk score ${riskScore} (${userIds.length} accounts)`;
      } else if (!banned && !restricted && riskScore >= 6) {
        restricted = true;
        restrictedUntil = now + 30 * 60 * 1000;
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
        serverFingerprint: args.serverFingerprint || (existing as any).serverFingerprint,
        spoofAttempts: spoofingDetected ? ((existing as any).spoofAttempts || 0) + 1 : (existing as any).spoofAttempts,
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
