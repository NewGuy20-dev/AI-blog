import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getEffectiveUserId } from "./lib/effectiveUser";

export const toggle = mutation({
  args: { postSlug: v.string(), asUserId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const userId = await getEffectiveUserId(ctx, args.asUserId);
    if (!userId) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("bookmarks")
      .withIndex("by_user_post", (q) => q.eq("clerkUserId", userId).eq("postSlug", args.postSlug))
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
      return { bookmarked: false };
    }

    await ctx.db.insert("bookmarks", {
      clerkUserId: userId,
      postSlug: args.postSlug,
      createdAt: Date.now(),
    });
    return { bookmarked: true };
  },
});

export const isBookmarked = query({
  args: { postSlug: v.string(), asUserId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const userId = await getEffectiveUserId(ctx, args.asUserId);
    if (!userId) return false;

    const bookmark = await ctx.db
      .query("bookmarks")
      .withIndex("by_user_post", (q) => q.eq("clerkUserId", userId).eq("postSlug", args.postSlug))
      .first();

    return !!bookmark;
  },
});

export const getUserBookmarks = query({
  args: { asUserId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const userId = await getEffectiveUserId(ctx, args.asUserId);
    if (!userId) return [];

    const bookmarks = await ctx.db
      .query("bookmarks")
      .withIndex("by_user", (q) => q.eq("clerkUserId", userId))
      .order("desc")
      .collect();

    return bookmarks.map((b) => b.postSlug);
  },
});

export const getBookmarkedPosts = query({
  args: { asUserId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const userId = await getEffectiveUserId(ctx, args.asUserId);
    if (!userId) return [];

    const bookmarks = await ctx.db
      .query("bookmarks")
      .withIndex("by_user", (q) => q.eq("clerkUserId", userId))
      .order("desc")
      .collect();

    const posts = await Promise.all(
      bookmarks.map(async (b) => {
        const post = await ctx.db
          .query("posts")
          .withIndex("by_slug", (q) => q.eq("slug", b.postSlug))
          .first();
        return post;
      })
    );

    return posts.filter(Boolean);
  },
});

export const clear = mutation({
  args: { asUserId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const userId = await getEffectiveUserId(ctx, args.asUserId);
    if (!userId) throw new Error("Not authenticated");

    const bookmarks = await ctx.db
      .query("bookmarks")
      .withIndex("by_user", (q) => q.eq("clerkUserId", userId))
      .collect();

    for (const bookmark of bookmarks) {
      await ctx.db.delete(bookmark._id);
    }

    return { cleared: bookmarks.length };
  },
});
