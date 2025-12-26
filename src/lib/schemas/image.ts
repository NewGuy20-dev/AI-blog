import { z } from "zod";

export const ImageAttributionSchema = z.object({
  creator: z.string().optional(),
  creatorUrl: z.string().optional(),
  license: z.string(),
  licenseUrl: z.string().optional(),
  source: z.string(),
  sourceUrl: z.string(),
});

export const FeaturedImageSchema = z.object({
  url: z.string(),
  alt: z.string(),
  attribution: ImageAttributionSchema.optional(),
});

export type ImageAttribution = z.infer<typeof ImageAttributionSchema>;
export type FeaturedImage = z.infer<typeof FeaturedImageSchema>;
