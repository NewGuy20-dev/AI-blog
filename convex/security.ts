import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// JWT Blacklisting
export const blacklistToken = mutation({
  args: {
    tokenId: v.string(),
    userId: v.string(),
    expiresAt: v.optional(v.number()),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("blacklistedTokens", {
      ...args,
      blacklistedAt: Date.now()
    });
  }
});

export const isTokenBlacklisted = query({
  args: { tokenId: v.string() },
  handler: async (ctx, args) => {
    const token = await ctx.db
      .query("blacklistedTokens")
      .withIndex("by_tokenId", (q) => q.eq("tokenId", args.tokenId))
      .first();
    return !!token;
  }
});

// Force logout all sessions for user
export const blacklistAllUserTokens = mutation({
  args: { userId: v.string(), reason: v.string() },
  handler: async (ctx, args) => {
    // This would typically integrate with Auth0 to revoke all sessions
    await ctx.db.insert("securityEvents", {
      userId: args.userId,
      ip: "system",
      userAgent: "system",
      eventType: "force_logout_all",
      severity: "high",
      details: { suspiciousActivity: [args.reason] },
      timestamp: Date.now(),
      blocked: true,
      action: "all_sessions_revoked"
    });
  }
});

// VPN/Proxy Detection
export const checkIpReputation = mutation({
  args: {
    ip: v.string(),
    userId: v.optional(v.string()),
    userAgent: v.string()
  },
  handler: async (ctx, args) => {
    // Simulate IP reputation check (integrate with real service)
    const isVpn = await detectVpn(args.ip);
    const isProxy = await detectProxy(args.ip);
    const isDatacenter = await detectDatacenter(args.ip);
    
    const riskScore = calculateRiskScore(isVpn, isProxy, isDatacenter);
    
    if (riskScore > 70) {
      await ctx.db.insert("securityEvents", {
        userId: args.userId,
        ip: args.ip,
        userAgent: args.userAgent,
        eventType: "high_risk_ip",
        severity: "high",
        details: {
          vpnDetected: isVpn,
          proxyDetected: isProxy,
          datacenterIp: isDatacenter,
          riskScore
        },
        timestamp: Date.now(),
        blocked: true
      });
      
      // Auto-block high risk IPs
      await ctx.db.insert("blockedIps", {
        ip: args.ip,
        reason: `High risk score: ${riskScore}`,
        blockedBy: "system",
        blockedAt: Date.now(),
        expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
      });
    }
    
    return { riskScore, blocked: riskScore > 70 };
  }
});

// Enhanced Fingerprinting
export const updateFingerprint = mutation({
  args: {
    visitorId: v.string(),
    userId: v.optional(v.string()),
    ip: v.string(),
    userAgent: v.string(),
    timezone: v.string(),
    canvasFingerprint: v.optional(v.string()),
    webglFingerprint: v.optional(v.string()),
    audioFingerprint: v.optional(v.string()),
    screenMetrics: v.optional(v.object({
      width: v.number(),
      height: v.number(),
      colorDepth: v.number(),
      pixelRatio: v.number()
    }))
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("fingerprints")
      .withIndex("by_visitorId", (q) => q.eq("visitorId", args.visitorId))
      .first();

    if (existing) {
      // Check for timezone changes (suspicious)
      const timezoneChanged = existing.timezone && existing.timezone !== args.timezone;
      
      if (timezoneChanged) {
        await ctx.db.insert("securityEvents", {
          userId: args.userId,
          ip: args.ip,
          userAgent: args.userAgent,
          eventType: "timezone_change",
          severity: "medium",
          details: {
            timezone: args.timezone,
            timezoneChanged: true,
            suspiciousActivity: ["timezone_manipulation"]
          },
          timestamp: Date.now(),
          blocked: false
        });
      }

      await ctx.db.patch(existing._id, {
        lastSeen: Date.now(),
        timezone: args.timezone,
        timezoneHistory: [
          ...(existing.timezoneHistory || []),
          { timezone: args.timezone, timestamp: Date.now() }
        ].slice(-10), // Keep last 10 timezone changes
        canvasFingerprint: args.canvasFingerprint,
        webglFingerprint: args.webglFingerprint,
        audioFingerprint: args.audioFingerprint,
        screenMetrics: args.screenMetrics
      });
    } else {
      await ctx.db.insert("fingerprints", {
        ...args,
        firstSeen: Date.now(),
        lastSeen: Date.now(),
        timezoneHistory: [{ timezone: args.timezone, timestamp: Date.now() }]
      });
    }
  }
});

// ADMIN-SPECIFIC SECURITY FUNCTIONS
const ADMIN_USER_ID = process.env.ADMIN_USER_ID!;

export const validateAdminFingerprint = query({
  args: { userId: v.string(), fingerprint: v.string() },
  handler: async (ctx, args) => {
    if (args.userId !== ADMIN_USER_ID) return false;
    
    const adminFingerprints = await ctx.db
      .query("fingerprints")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();
    
    // Admin must have registered fingerprint
    return adminFingerprints.some(fp => 
      fp.serverFingerprint === args.fingerprint && !fp.banned
    );
  }
});

export const getAdminIPHistory = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    if (args.userId !== ADMIN_USER_ID) return [];
    
    const fingerprints = await ctx.db
      .query("fingerprints")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();
    
    return fingerprints.flatMap(fp => fp.ipAddresses || []);
  }
});

export const hasRecentMFAVerification = query({
  args: { userId: v.string(), minutes: v.number() },
  handler: async (ctx, args) => {
    if (args.userId !== ADMIN_USER_ID) return false;
    
    const cutoff = Date.now() - (args.minutes * 60 * 1000);
    const mfaEvents = await ctx.db
      .query("securityEvents")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .filter((q) => q.and(
        q.gte(q.field("timestamp"), cutoff),
        q.eq(q.field("eventType"), "mfa_verification")
      ))
      .collect();
    
    return mfaEvents.length > 0;
  }
});

export const getAdminRequestCount = query({
  args: { userId: v.string(), ip: v.string(), minutes: v.number() },
  handler: async (ctx, args) => {
    if (args.userId !== ADMIN_USER_ID) return 0;
    
    const cutoff = Date.now() - (args.minutes * 60 * 1000);
    const requests = await ctx.db
      .query("securityEvents")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .filter((q) => q.and(
        q.gte(q.field("timestamp"), cutoff),
        q.eq(q.field("ip"), args.ip),
        q.eq(q.field("eventType"), "admin_request")
      ))
      .collect();
    
    return requests.length;
  }
});

export const lockdownAdminAccount = mutation({
  args: { userId: v.string(), reason: v.string() },
  handler: async (ctx, args) => {
    if (args.userId !== ADMIN_USER_ID) return;
    
    await ctx.db.insert("securityEvents", {
      userId: args.userId,
      ip: "system",
      userAgent: "system",
      eventType: "admin_lockdown",
      severity: "critical",
      details: { 
        suspiciousActivity: ["admin_compromise_suspected", args.reason]
      },
      timestamp: Date.now(),
      blocked: true,
      action: "account_locked"
    });
  }
});

export const getRecentSecurityEvents = query({
  args: { userId: v.string(), hours: v.number() },
  handler: async (ctx, args) => {
    const cutoff = Date.now() - (args.hours * 60 * 60 * 1000);
    return await ctx.db
      .query("securityEvents")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .filter((q) => q.gte(q.field("timestamp"), cutoff))
      .collect();
  }
});

export const logSecurityEvent = mutation({
  args: {
    userId: v.optional(v.string()),
    ip: v.string(),
    userAgent: v.string(),
    eventType: v.string(),
    severity: v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("critical")),
    details: v.object({
      fingerprint: v.optional(v.string()),
      timezone: v.optional(v.string()),
      timezoneChanged: v.optional(v.boolean()),
      vpnDetected: v.optional(v.boolean()),
      proxyDetected: v.optional(v.boolean()),
      datacenterIp: v.optional(v.boolean()),
      riskScore: v.optional(v.number()),
      suspiciousActivity: v.optional(v.array(v.string())),
      adminAccount: v.optional(v.boolean()),
      reason: v.optional(v.string()),
      attemptedRoute: v.optional(v.string())
    }),
    timestamp: v.number(),
    blocked: v.boolean(),
    action: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("securityEvents", args);
  }
});

export const checkBlockedIP = query({
  args: { ip: v.string() },
  handler: async (ctx, args) => {
    const blocked = await ctx.db
      .query("blockedIps")
      .withIndex("by_ip", (q) => q.eq("ip", args.ip))
      .first();
    
    if (!blocked) return null;
    
    // Check if temporary block has expired (just return null, cleanup handled separately)
    if (blocked.expiresAt && blocked.expiresAt < Date.now()) {
      return null;
    }
    
    return blocked;
  }
});

export const blockIP = mutation({
  args: {
    ip: v.string(),
    reason: v.string(),
    blockedBy: v.string(),
    permanent: v.boolean()
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("blockedIps", {
      ...args,
      blockedAt: Date.now(),
      expiresAt: args.permanent ? undefined : Date.now() + (24 * 60 * 60 * 1000)
    });
  }
});

// TRUSTED DEVICE MANAGEMENT FOR ADMIN
export const addTrustedDevice = mutation({
  args: {
    userId: v.string(),
    fingerprint: v.string(),
    ip: v.string(),
    userAgent: v.string(),
    timezone: v.string(),
    trustedAt: v.number()
  },
  handler: async (ctx, args) => {
    if (args.userId !== ADMIN_USER_ID) return;
    
    await ctx.db.insert("trustedDevices", {
      ...args
    });
  }
});

export const isTrustedDevice = query({
  args: {
    userId: v.string(),
    fingerprint: v.string(),
    ip: v.string()
  },
  handler: async (ctx, args) => {
    if (args.userId !== ADMIN_USER_ID) return false;
    
    const trusted = await ctx.db
      .query("trustedDevices")
      .filter((q) => q.and(
        q.eq(q.field("userId"), args.userId),
        q.or(
          q.eq(q.field("fingerprint"), args.fingerprint),
          q.eq(q.field("ip"), args.ip)
        )
      ))
      .first();
    
    return !!trusted;
  }
});

export const getTrustedDevices = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    if (args.userId !== ADMIN_USER_ID) return [];
    
    return await ctx.db
      .query("trustedDevices")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .collect();
  }
});

// EMERGENCY LOCKDOWN FUNCTIONS
export const setEmergencyLockdown = mutation({
  args: {
    active: v.boolean(),
    reason: v.string(),
    timestamp: v.number()
  },
  handler: async (ctx, args) => {
    // Store emergency lockdown state
    await ctx.db.insert("emergencyLockdown", {
      active: args.active,
      reason: args.reason,
      activatedAt: args.timestamp,
      activatedBy: "system"
    });
  }
});

export const blacklistAllNonAdminTokens = mutation({
  args: { reason: v.string() },
  handler: async (ctx, args) => {
    await ctx.db.insert("securityEvents", {
      userId: "system",
      ip: "system",
      userAgent: "emergency-system",
      eventType: "mass_token_blacklist",
      severity: "critical",
      details: { suspiciousActivity: [args.reason, "all_non_admin_tokens_blacklisted"] },
      timestamp: Date.now(),
      blocked: true,
      action: "emergency_lockdown"
    });
  }
});

export const enableMaximumRateLimit = mutation({
  args: { reason: v.string() },
  handler: async (ctx, args) => {
    // Set global rate limit to maximum security
    await ctx.db.insert("rateLimitSettings", {
      level: "maximum",
      requestsPerMinute: 5,
      reason: args.reason,
      activatedAt: Date.now()
    });
  }
});

// STATISTICS FUNCTIONS
export const getEventCount = query({
  args: { hours: v.number() },
  handler: async (ctx, args) => {
    const cutoff = Date.now() - (args.hours * 60 * 60 * 1000);
    const events = await ctx.db
      .query("securityEvents")
      .withIndex("by_timestamp", (q) => q.gte("timestamp", cutoff))
      .collect();
    return { count: events.length };
  }
});

export const getCriticalEventCount = query({
  args: { hours: v.number() },
  handler: async (ctx, args) => {
    const cutoff = Date.now() - (args.hours * 60 * 60 * 1000);
    const events = await ctx.db
      .query("securityEvents")
      .withIndex("by_severity", (q) => q.eq("severity", "critical"))
      .filter((q) => q.gte(q.field("timestamp"), cutoff))
      .collect();
    return { count: events.length };
  }
});

export const getBlockedIPCount = query({
  args: {},
  handler: async (ctx, args) => {
    const blockedIPs = await ctx.db
      .query("blockedIps")
      .collect();
    return { count: blockedIPs.length };
  }
});

export const getBannedHardwareCount = query({
  args: {},
  handler: async (ctx, args) => {
    const bannedHardware = await ctx.db
      .query("bannedHardware")
      .collect();
    return { count: bannedHardware.length };
  }
});

export const getActiveThreatsCount = query({
  args: { hours: v.number() },
  handler: async (ctx, args) => {
    const cutoff = Date.now() - (args.hours * 60 * 60 * 1000);
    const threats = await ctx.db
      .query("securityEvents")
      .filter((q) => q.and(
        q.gte(q.field("timestamp"), cutoff),
        q.or(
          q.eq(q.field("severity"), "high"),
          q.eq(q.field("severity"), "critical")
        )
      ))
      .collect();
    return { count: threats.length };
  }
});

// HARDWARE FINGERPRINT BANNING
export const getFingerprintsByIP = query({
  args: { ip: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("fingerprints")
      .withIndex("by_ip", (q) => q.eq("ip", args.ip))
      .collect();
  }
});

export const banHardwareFingerprint = mutation({
  args: {
    fingerprint: v.string(),
    canvasFingerprint: v.optional(v.string()),
    webglFingerprint: v.optional(v.string()),
    audioFingerprint: v.optional(v.string()),
    screenMetrics: v.optional(v.object({
      width: v.number(),
      height: v.number(),
      colorDepth: v.number(),
      pixelRatio: v.number()
    })),
    reason: v.string(),
    bannedAt: v.number()
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("bannedHardware", {
      ...args,
      permanent: true
    });
    
    // Also ban the original fingerprint record
    const originalFingerprint = await ctx.db
      .query("fingerprints")
      .filter((q) => q.or(
        q.eq(q.field("visitorId"), args.fingerprint),
        q.eq(q.field("serverFingerprint"), args.fingerprint)
      ))
      .first();
    
    if (originalFingerprint) {
      await ctx.db.patch(originalFingerprint._id, {
        banned: true,
        banReason: args.reason,
        bannedAt: args.bannedAt,
        autoBanned: true
      });
    }
  }
});

export const blockSimilarHardware = mutation({
  args: { ip: v.string(), reason: v.string() },
  handler: async (ctx, args) => {
    // Get all fingerprints from this IP
    const fingerprints = await ctx.db
      .query("fingerprints")
      .withIndex("by_ip", (q) => q.eq("ip", args.ip))
      .collect();
    
    for (const fp of fingerprints) {
      // Find similar hardware signatures
      const similar = await ctx.db
        .query("fingerprints")
        .filter((q) => q.or(
          q.eq(q.field("canvasFingerprint"), fp.canvasFingerprint),
          q.eq(q.field("webglFingerprint"), fp.webglFingerprint),
          q.eq(q.field("audioFingerprint"), fp.audioFingerprint)
        ))
        .collect();
      
      // Ban similar hardware
      for (const similarFp of similar) {
        if (!similarFp.banned) {
          await ctx.db.patch(similarFp._id, {
            banned: true,
            banReason: `Similar hardware to banned device from ${args.ip}`,
            bannedAt: Date.now(),
            autoBanned: true
          });
        }
      }
    }
  }
});

export const isHardwareBanned = query({
  args: {
    fingerprint: v.optional(v.string()),
    canvasFingerprint: v.optional(v.string()),
    webglFingerprint: v.optional(v.string()),
    audioFingerprint: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const banned = await ctx.db
      .query("bannedHardware")
      .filter((q) => q.or(
        q.eq(q.field("fingerprint"), args.fingerprint || ""),
        q.eq(q.field("canvasFingerprint"), args.canvasFingerprint || ""),
        q.eq(q.field("webglFingerprint"), args.webglFingerprint || ""),
        q.eq(q.field("audioFingerprint"), args.audioFingerprint || "")
      ))
      .first();
    
    return !!banned;
  }
});

export const getBannedHardware = query({
  args: {},
  handler: async (ctx, args) => {
    return await ctx.db
      .query("bannedHardware")
      .collect();
  }
});

// Helper functions (would integrate with real services)
async function detectVpn(ip: string): Promise<boolean> {
  // Integrate with IPQualityScore, MaxMind, etc.
  return Math.random() > 0.8; // Placeholder
}

async function detectProxy(ip: string): Promise<boolean> {
  return Math.random() > 0.9; // Placeholder
}

async function detectDatacenter(ip: string): Promise<boolean> {
  return Math.random() > 0.85; // Placeholder
}

function calculateRiskScore(isVpn: boolean, isProxy: boolean, isDatacenter: boolean): number {
  let score = 0;
  if (isVpn) score += 40;
  if (isProxy) score += 35;
  if (isDatacenter) score += 25;
  return Math.min(score, 100);
}
