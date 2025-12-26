import { v } from "convex/values";
import { mutation } from "./_generated/server";

export const log = mutation({
    args: {
        runId: v.string(),
        stage: v.string(),
        status: v.string(),
        input: v.optional(v.any()),
        output: v.optional(v.any()),
        durationMs: v.number(),
    },
    handler: async (ctx, args) => {
        await ctx.db.insert("audit", {
            ...args,
            createdAt: Date.now(),
        });
    },
});
