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
});
