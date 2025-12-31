import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { getEffectiveUserId } from "./lib/effectiveUser";

function getDayStart(timestamp: number): number {
  const date = new Date(timestamp);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

export const markArticleRead = mutation({
  args: { postSlug: v.string(), asUserId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const userId = await getEffectiveUserId(ctx, args.asUserId);
    if (!userId) return { alreadyRead: false, notAuthenticated: true };

    // Check if already read
    const existing = await ctx.db
      .query("readArticles")
      .withIndex("by_user_post", (q) => q.eq("userId", userId).eq("postSlug", args.postSlug))
      .first();

    if (existing) return { alreadyRead: true };

    const now = Date.now();
    const todayStart = getDayStart(now);
    const yesterdayStart = todayStart - 86400000;

    // Insert read record
    await ctx.db.insert("readArticles", {
      userId,
      postSlug: args.postSlug,
      readAt: now,
    });

    // Get or create user profile
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    const currentStats = profile?.stats || {};
    const lastReadDate = currentStats.lastReadDate || 0;
    const lastReadDayStart = getDayStart(lastReadDate);

    let newStreak: number;
    if (lastReadDayStart === todayStart) {
      // Already read today, keep streak
      newStreak = currentStats.readingStreak || 1;
    } else if (lastReadDayStart === yesterdayStart) {
      // Read yesterday, increment streak
      newStreak = (currentStats.readingStreak || 0) + 1;
    } else {
      // Streak broken, reset to 1
      newStreak = 1;
    }

    const newStats = {
      ...currentStats,
      articlesRead: (currentStats.articlesRead || 0) + 1,
      readingStreak: newStreak,
      lastReadDate: now,
      lastActive: now,
    };

    if (profile) {
      await ctx.db.patch(profile._id, { stats: newStats, updatedAt: now });
    } else {
      await ctx.db.insert("userProfiles", {
        userId,
        stats: newStats,
        createdAt: now,
        updatedAt: now,
      });
    }

    return { alreadyRead: false, articlesRead: newStats.articlesRead, streak: newStreak };
  },
});
