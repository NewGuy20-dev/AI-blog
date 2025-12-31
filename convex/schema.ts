import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    email: v.string(),
    createdAt: v.number(),
  }).index("by_email", ["email"]),

  userProfiles: defineTable({
    userId: v.string(),
    bio: v.optional(v.string()),
    website: v.optional(v.string()),
    twitter: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    preferences: v.optional(v.object({
      theme: v.optional(v.string()),
      accentColor: v.optional(v.string()),
      fontSize: v.optional(v.string()),
      reducedMotion: v.optional(v.boolean()),
      emailDigest: v.optional(v.string()),
      pushNotifications: v.optional(v.boolean()),
    })),
    stats: v.optional(v.object({
      articlesRead: v.optional(v.number()),
      readingStreak: v.optional(v.number()),
      lastActive: v.optional(v.number()),
      lastReadDate: v.optional(v.number()),
    })),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_userId", ["userId"]),

  posts: defineTable({
    slug: v.string(),
    title: v.string(),
    summary: v.string(),
    content: v.array(v.any()),
    sources: v.array(
      v.object({
        title: v.string(),
        url: v.string(),
      })
    ),
    tags: v.array(v.string()),
    category: v.optional(v.string()),
    status: v.union(v.literal("draft"), v.literal("published"), v.literal("archived"), v.literal("rejected")),
    publishedAt: v.number(),
    readingTime: v.number(),
    iterations: v.optional(v.number()),
    rejectionReason: v.optional(v.array(v.object({
      category: v.string(),
      subcategory: v.string(),
      severity: v.string(),
      description: v.string(),
    }))),
    featuredImage: v.optional(v.object({
      url: v.string(),
      alt: v.string(),
      attribution: v.optional(v.object({
        creator: v.optional(v.string()),
        creatorUrl: v.optional(v.string()),
        license: v.string(),
        licenseUrl: v.optional(v.string()),
        source: v.string(),
        sourceUrl: v.string(),
      })),
    })),
  })
    .index("by_slug", ["slug"])
    .index("by_category", ["category", "publishedAt"])
    .index("by_status", ["status", "publishedAt"]),

  bookmarks: defineTable({
    clerkUserId: v.string(),
    postSlug: v.string(),
    createdAt: v.number(),
  })
    .index("by_user", ["clerkUserId"])
    .index("by_user_post", ["clerkUserId", "postSlug"]),

  readArticles: defineTable({
    userId: v.string(),
    postSlug: v.string(),
    readAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_post", ["userId", "postSlug"]),

  subscribers: defineTable({
    email: v.string(),
    subscribedAt: v.number(),
  }).index("by_email", ["email"]),

  audit: defineTable({
    runId: v.string(),
    stage: v.string(),
    status: v.string(),
    input: v.optional(v.any()),
    output: v.optional(v.any()),
    durationMs: v.number(),
    createdAt: v.number(),
  }).index("by_runId", ["runId"]),

  admins: defineTable({
    userId: v.string(),
    addedBy: v.string(),
    addedAt: v.number(),
    isOriginal: v.boolean(),
  }).index("by_userId", ["userId"]),

  supportAccess: defineTable({
    userId: v.string(),
    grantedAt: v.number(),
    expiresAt: v.number(),
    reason: v.optional(v.string()),
    revokedAt: v.optional(v.number()),
  })
    .index("by_userId", ["userId"])
    .index("by_expiresAt", ["expiresAt"]),

  blockedIps: defineTable({
    ip: v.string(),
    reason: v.optional(v.string()),
    blockedBy: v.string(),
    blockedAt: v.number(),
    expiresAt: v.optional(v.number()),
  }).index("by_ip", ["ip"]),

  fingerprints: defineTable({
    visitorId: v.string(),
    userId: v.optional(v.string()),
    userIds: v.optional(v.array(v.string())),
    ip: v.optional(v.string()),
    ipAddresses: v.optional(v.array(v.string())),
    userAgent: v.optional(v.string()),
    timezone: v.optional(v.string()),
    timezoneHistory: v.optional(v.array(v.object({
      timezone: v.string(),
      timestamp: v.number(),
    }))),
    serverFingerprint: v.optional(v.string()),
    canvasFingerprint: v.optional(v.string()),
    webglFingerprint: v.optional(v.string()),
    audioFingerprint: v.optional(v.string()),
    screenMetrics: v.optional(v.object({
      width: v.number(),
      height: v.number(),
      colorDepth: v.number(),
      pixelRatio: v.number(),
    })),
    spoofAttempts: v.optional(v.number()),
    firstSeen: v.number(),
    lastSeen: v.number(),
    loginTimes: v.optional(v.array(v.number())),
    riskScore: v.optional(v.number()),
    banned: v.optional(v.boolean()),
    banReason: v.optional(v.string()),
    bannedAt: v.optional(v.number()),
    autoBanned: v.optional(v.boolean()),
    restricted: v.optional(v.boolean()),
    restrictedUntil: v.optional(v.number()),
  })
    .index("by_visitorId", ["visitorId"])
    .index("by_userId", ["userId"])
    .index("by_ip", ["ip"])
    .index("by_banned", ["banned"]),

  blacklistedTokens: defineTable({
    tokenId: v.string(),
    userId: v.string(),
    reason: v.string(),
    blacklistedAt: v.number(),
    expiresAt: v.optional(v.number()),
  }).index("by_tokenId", ["tokenId"]),

  securityEvents: defineTable({
    eventType: v.string(),
    userId: v.optional(v.string()),
    ip: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    fingerprint: v.optional(v.string()),
    details: v.optional(v.any()),
    severity: v.string(),
    timestamp: v.number(),
    blocked: v.optional(v.boolean()),
    action: v.optional(v.string()),
  })
    .index("by_userId", ["userId"])
    .index("by_eventType", ["eventType"])
    .index("by_timestamp", ["timestamp"])
    .index("by_severity", ["severity"]),

  trustedDevices: defineTable({
    userId: v.string(),
    fingerprint: v.string(),
    ip: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    timezone: v.optional(v.string()),
    name: v.optional(v.string()),
    addedAt: v.optional(v.number()),
    trustedAt: v.optional(v.number()),
    lastUsed: v.optional(v.number()),
  })
    .index("by_userId", ["userId"])
    .index("by_fingerprint", ["fingerprint"]),

  bannedHardware: defineTable({
    hardwareFingerprint: v.optional(v.string()),
    fingerprint: v.optional(v.string()),
    canvasFingerprint: v.optional(v.string()),
    webglFingerprint: v.optional(v.string()),
    audioFingerprint: v.optional(v.string()),
    screenMetrics: v.optional(v.object({
      width: v.number(),
      height: v.number(),
      colorDepth: v.number(),
      pixelRatio: v.number(),
    })),
    reason: v.string(),
    bannedAt: v.number(),
    bannedBy: v.optional(v.string()),
    permanent: v.optional(v.boolean()),
  }).index("by_fingerprint", ["hardwareFingerprint"]),

  emergencyLockdown: defineTable({
    active: v.boolean(),
    activatedAt: v.number(),
    activatedBy: v.string(),
    reason: v.string(),
    deactivatedAt: v.optional(v.number()),
  }).index("by_active", ["active"]),

  rateLimitSettings: defineTable({
    endpoint: v.optional(v.string()),
    level: v.optional(v.string()),
    maxRequests: v.optional(v.number()),
    requestsPerMinute: v.optional(v.number()),
    windowMs: v.optional(v.number()),
    reason: v.optional(v.string()),
    activatedAt: v.optional(v.number()),
    updatedAt: v.optional(v.number()),
  }).index("by_endpoint", ["endpoint"]),

  botActionKey: defineTable({
    key: v.string(),
    createdAt: v.number(),
    usedAt: v.optional(v.number()),
    usedBy: v.optional(v.string()),
  }),

  adminMasterKey: defineTable({
    key: v.string(),
    createdAt: v.number(),
    lastUsedAt: v.optional(v.number()),
    lastUsedBy: v.optional(v.string()),
  }),

  botRateLimit: defineTable({
    discordUserId: v.string(),
    timestamps: v.array(v.number()),
  }).index("by_discordUserId", ["discordUserId"]),
});
