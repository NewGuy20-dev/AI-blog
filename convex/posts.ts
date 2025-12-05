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

export const getRelated = query({
    args: { slug: v.string(), tags: v.array(v.string()), limit: v.optional(v.number()) },
    handler: async (ctx, args) => {
        const posts = await ctx.db.query("posts").order("desc").take(50);
        const related = posts
            .filter((p) => p.slug !== args.slug && p.tags.some((t) => args.tags.includes(t)))
            .slice(0, args.limit ?? 3);
        if (related.length < (args.limit ?? 3)) {
            const fallback = posts.filter((p) => p.slug !== args.slug && !related.includes(p));
            return [...related, ...fallback].slice(0, args.limit ?? 3);
        }
        return related;
    },
});
