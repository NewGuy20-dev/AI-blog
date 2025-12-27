import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const ADMIN_USER_IDS = [
  "google-oauth2|101765812180352599429",
  
];

const isAdmin = (userId: string) => ADMIN_USER_IDS.includes(userId);

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

export const getRecentRuns = query({
  args: { userId: v.string(), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    if (!isAdmin(args.userId)) return [];
    
    const logs = await ctx.db.query("audit").order("desc").take(500);
    
    const runMap = new Map<string, {
      runId: string;
      startedAt: number;
      topic?: string;
      status: string;
      stages: string[];
    }>();

    for (const log of logs) {
      if (!runMap.has(log.runId)) {
        runMap.set(log.runId, {
          runId: log.runId,
          startedAt: log.createdAt,
          status: "running",
          stages: [],
        });
      }
      
      const run = runMap.get(log.runId)!;
      run.stages.push(log.stage);
      
      if (log.stage === "discovery" && log.output) {
        try {
          const output = typeof log.output === "string" ? JSON.parse(log.output) : log.output;
          run.topic = output.topic;
        } catch {}
      }
      
      if (log.stage === "save") run.status = log.status === "success" ? "published" : log.status;
      if (log.stage === "error") run.status = "failed";
      if (log.status === "rejected") run.status = "rejected";
    }

    return Array.from(runMap.values())
      .sort((a, b) => b.startedAt - a.startedAt)
      .slice(0, args.limit || 20);
  },
});

export const getRunDetails = query({
  args: { userId: v.string(), runId: v.string() },
  handler: async (ctx, args) => {
    if (!isAdmin(args.userId)) return null;
    
    const logs = await ctx.db.query("audit").order("desc").take(1000);
    const runLogs = logs
      .filter(l => l.runId === args.runId)
      .sort((a, b) => a.createdAt - b.createdAt);

    return runLogs.map(log => ({
      stage: log.stage,
      status: log.status,
      input: log.input,
      output: log.output,
      createdAt: log.createdAt,
    }));
  },
});
