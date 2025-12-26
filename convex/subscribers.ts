import { v } from "convex/values";
import { mutation } from "./_generated/server";

export const subscribe = mutation({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("subscribers")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
    if (existing) return { success: true, message: "Already subscribed" };
    await ctx.db.insert("subscribers", { email: args.email, subscribedAt: Date.now() });
    return { success: true, message: "Subscribed!" };
  },
});
