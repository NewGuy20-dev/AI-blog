import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";

const postArgs = {
  slug: v.string(),
  title: v.string(),
  summary: v.string(),
  content: v.array(v.any()),
  sources: v.array(v.object({ title: v.string(), url: v.string() })),
  tags: v.array(v.string()),
  category: v.optional(v.string()),
  status: v.union(v.literal("draft"), v.literal("published")),
  publishedAt: v.number(),
  readingTime: v.number(),
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
};

// Internal mutation for pipeline/cron jobs (no auth needed)
export const createInternal = internalMutation({
  args: postArgs,
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("posts")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();
    if (existing) return existing._id;
    return await ctx.db.insert("posts", args);
  },
});

// Public create - requires authentication
export const create = mutation({
  args: postArgs,
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("posts")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();
    if (existing) return existing._id;
    return await ctx.db.insert("posts", args);
  },
});

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("posts")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();
  },
});

export const list = query({
  args: { 
    limit: v.optional(v.number()),
    category: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;
    const posts = await ctx.db.query("posts").order("desc").take(limit + 50);

    let filtered = posts.filter((p) => p.status !== "archived" && p.status !== "rejected");

    if (args.category) {
      const cat = args.category.toLowerCase();
      filtered = filtered.filter(
        (p) => p.category?.toLowerCase() === cat || p.tags?.some((t) => t.toLowerCase() === cat)
      );
    }

    return filtered.slice(0, limit);
  },
});

export const getRecentTitles = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const posts = await ctx.db.query("posts").order("desc").take(args.limit ?? 10);
    return posts.map((p) => p.title);
  },
});

export const getRelated = query({
  args: {
    slug: v.string(),
    tags: v.array(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const posts = await ctx.db.query("posts").order("desc").take(50);
    const related = posts
      .filter((p) => p.slug !== args.slug && p.status === "published" && p.tags.some((t) => args.tags.includes(t)))
      .slice(0, args.limit ?? 3);

    if (related.length < (args.limit ?? 3)) {
      const fallback = posts.filter((p) => p.slug !== args.slug && p.status === "published" && !related.includes(p));
      return [...related, ...fallback].slice(0, args.limit ?? 3);
    }
    return related;
  },
});

// Internal mutation for archiving (used by cron)
export const archiveOldInternal = internalMutation({
  args: { maxAgeDays: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const maxAge = (args.maxAgeDays ?? 30) * 24 * 60 * 60 * 1000;
    const cutoff = Date.now() - maxAge;
    const posts = await ctx.db.query("posts").collect();
    const toArchive = posts.filter((p) => p.status === "published" && p.publishedAt < cutoff);
    for (const post of toArchive) {
      await ctx.db.patch(post._id, { status: "archived" });
    }
    return { archived: toArchive.length };
  },
});

// Public archiveOld - requires auth
export const archiveOld = mutation({
  args: { maxAgeDays: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const maxAge = (args.maxAgeDays ?? 30) * 24 * 60 * 60 * 1000;
    const cutoff = Date.now() - maxAge;
    const posts = await ctx.db.query("posts").collect();
    const toArchive = posts.filter((p) => p.status === "published" && p.publishedAt < cutoff);
    for (const post of toArchive) {
      await ctx.db.patch(post._id, { status: "archived" });
    }
    return { archived: toArchive.length };
  },
});
