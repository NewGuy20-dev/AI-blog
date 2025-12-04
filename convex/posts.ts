import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const create = mutation({
    args: {
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
        status: v.union(v.literal("draft"), v.literal("published")),
        publishedAt: v.number(),
        readingTime: v.number(),
    },
    handler: async (ctx, args) => {
        const existing = await ctx.db
            .query("posts")
            .withIndex("by_slug", (q) => q.eq("slug", args.slug))
            .first();

        if (existing) {
            // For MVP, maybe skip or update? Let's skip if exists to avoid dupes
            return existing._id;
        }

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
    args: { limit: v.optional(v.number()) },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("posts")
            .order("desc")
            .take(args.limit ?? 20);
    },
});

export const getRecentTitles = query({
    args: { limit: v.optional(v.number()) },
    handler: async (ctx, args) => {
        const posts = await ctx.db
            .query("posts")
            .order("desc")
            .take(args.limit ?? 10);
        return posts.map((p) => p.title);
    },
});
