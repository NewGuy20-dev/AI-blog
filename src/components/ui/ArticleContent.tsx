import Image from "next/image";
import React from "react";

interface ContentBlock {
  type: "paragraph" | "heading" | "image";
  text?: string;
  level?: number;
  url?: string;
  alt?: string;
}

export function ArticleContent({ content }: { content: ContentBlock[] }) {
  let headingIndex = 0;

  return (
    <div className="font-serif text-lg leading-relaxed">
      {content.map((block, index) => {
        switch (block.type) {
          case "heading": {
            const level = block.level || 2;
            const sizes: Record<number, string> = {
              1: "text-3xl",
              2: "text-2xl",
              3: "text-xl",
            };
            const id = `heading-${headingIndex++}`;
            return React.createElement(
              `h${level}`,
              {
                key: index,
                id,
                className: `font-sans font-bold ${sizes[level] || "text-xl"} mt-10 mb-4 scroll-mt-20`,
              },
              block.text
            );
          }
          case "paragraph":
            return (
              <p key={index} className="mb-6 text-[var(--color-text-muted)]">
                {block.text}
              </p>
            );
          case "image":
            return (
              <figure key={index} className="my-10">
                <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-[var(--color-border)]">
                  {block.url && (
                    <Image
                      src={block.url}
                      alt={block.alt || "Article image"}
                      fill
                      className="object-cover"
                    />
                  )}
                </div>
                {block.alt && (
                  <figcaption className="mt-3 text-center text-sm text-[var(--color-text-muted)] font-sans">
                    {block.alt}
                  </figcaption>
                )}
              </figure>
            );
          default:
            return null;
        }
      })}
    </div>
  );
}
