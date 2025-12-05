"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { ArticleCard } from "./ArticleCard";

interface RelatedArticlesProps {
  slug: string;
  tags: string[];
}

export function RelatedArticles({ slug, tags }: RelatedArticlesProps) {
  const related = useQuery(api.posts.getRelated, { slug, tags, limit: 3 });

  if (!related?.length) return null;

  return (
    <section className="mt-12">
      <h3 className="text-lg font-bold mb-6">Related Articles</h3>
      <div className="grid gap-6 md:grid-cols-3">
        {related.map((post: any) => (
          <ArticleCard key={post._id} post={post} />
        ))}
      </div>
    </section>
  );
}
