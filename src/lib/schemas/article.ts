import { z } from "zod";

export const ContentBlockSchema = z.discriminatedUnion("type", [
    z.object({ type: z.literal("paragraph"), text: z.string() }),
    z.object({ type: z.literal("heading"), level: z.number(), text: z.string() }),
    z.object({ type: z.literal("image"), url: z.string(), alt: z.string() }),
]);

export const FeaturedImageSchema = z.object({
    url: z.string(),
    alt: z.string(),
    credit: z.string().optional(),
    license: z.string().optional(),
});

export const ArticleSchema = z.object({
    title: z.string(),
    slug: z.string(),
    summary: z.string(),
    category: z.string().optional(),
    content: z.array(ContentBlockSchema),
    sources: z.array(z.object({ title: z.string(), url: z.string() })),
    tags: z.array(z.string()),
    readingTime: z.number().optional(),
    featuredImage: FeaturedImageSchema.optional(),
});

export type Article = z.infer<typeof ArticleSchema>;
export type ContentBlock = z.infer<typeof ContentBlockSchema>;
export type FeaturedImage = z.infer<typeof FeaturedImageSchema>;
