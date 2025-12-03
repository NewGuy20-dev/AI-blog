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
  return (
    <div className="font-serif text-slate-800 text-lg leading-relaxed">
      {content.map((block, index) => {
        switch (block.type) {
          case "heading": {
            const level = block.level || 2;
            const sizes: Record<number, string> = {
              1: "text-3xl",
              2: "text-2xl",
              3: "text-xl",
            };
            return React.createElement(
              `h${level}`,
              {
                key: index,
                className: `font-sans font-bold text-slate-900 ${sizes[level] || "text-xl"} mt-10 mb-4`,
              },
              block.text
            );
          }
          case "paragraph":
            return (
              <p key={index} className="mb-6">
                {block.text}
              </p>
            );
          case "image":
            return (
              <figure key={index} className="my-10">
                <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-slate-100">
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
                  <figcaption className="mt-3 text-center text-sm text-slate-500 font-sans">
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
