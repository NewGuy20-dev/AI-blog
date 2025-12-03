import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    email: v.string(),
    createdAt: v.number(),
  }).index("by_email", ["email"]),

  posts: defineTable({
    slug: v.string(),
    title: v.string(),
    summary: v.string(),
    content: v.array(v.any()), // Structured content (Paragraphs, Headings) - using v.any() for flexibility with Zod validation on write
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
  }).index("by_slug", ["slug"]),

  audit: defineTable({
    runId: v.string(),
    stage: v.string(),
    status: v.string(),
    input: v.optional(v.any()),
    output: v.optional(v.any()),
    durationMs: v.number(),
    createdAt: v.number(),
  }).index("by_runId", ["runId"]),
});
