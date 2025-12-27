import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const toggle = mutation({
  args: { postSlug: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const userId = identity.subject;
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
  args: { postSlug: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return false;

    const bookmark = await ctx.db
      .query("bookmarks")
      .withIndex("by_user_post", (q) => q.eq("clerkUserId", identity.subject).eq("postSlug", args.postSlug))
      .first();

    return !!bookmark;
  },
});

export const getUserBookmarks = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const bookmarks = await ctx.db
      .query("bookmarks")
      .withIndex("by_user", (q) => q.eq("clerkUserId", identity.subject))
      .order("desc")
      .collect();

    return bookmarks.map((b) => b.postSlug);
  },
});

export const getBookmarkedPosts = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const bookmarks = await ctx.db
      .query("bookmarks")
      .withIndex("by_user", (q) => q.eq("clerkUserId", identity.subject))
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
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const bookmarks = await ctx.db
      .query("bookmarks")
      .withIndex("by_user", (q) => q.eq("clerkUserId", identity.subject))
      .collect();

    for (const bookmark of bookmarks) {
      await ctx.db.delete(bookmark._id);
    }

    return { cleared: bookmarks.length };
  },
});


// Admin: get bookmarks by userId (requires support access)
export const getByUserId = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const HARDCODED_ADMIN_IDS = [
      "google-oauth2|101765812180352599429",
      
    ];
    
    if (!HARDCODED_ADMIN_IDS.includes(identity.subject)) {
      return [];
    }

    const now = Date.now();
    const grant = await ctx.db
      .query("supportAccess")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .filter((q) => q.and(
        q.gt(q.field("expiresAt"), now),
        q.eq(q.field("revokedAt"), undefined)
      ))
      .first();

    if (!grant) return [];

    return await ctx.db
      .query("bookmarks")
      .withIndex("by_user", (q) => q.eq("clerkUserId", args.userId))
      .collect();
  },
});
