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
        <div className="prose prose-lg prose-indigo max-w-none font-serif text-gray-800">
            {content.map((block, index) => {
                switch (block.type) {
                    case "heading": {
                        const level = block.level || 2;
                        const headingProps = {
                            key: index,
                            className: "font-sans font-bold text-gray-900 mt-8 mb-4",
                            children: block.text,
                        };
                        return React.createElement(`h${level}`, headingProps);
                    }
                    case "paragraph":
                        return (
                            <p key={index} className="mb-6 leading-relaxed">
                                {block.text}
                            </p>
                        );
                    case "image":
                        return (
                            <figure key={index} className="my-8">
                                <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-gray-100">
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
                                    <figcaption className="mt-2 text-center text-sm text-gray-500 font-sans">
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
