"use client";

import { useState } from "react";
import { Twitter, Linkedin, Link2, Check } from "lucide-react";

interface ShareButtonsProps {
  title: string;
  slug: string;
}

export function ShareButtons({ title, slug }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);
  const url = typeof window !== "undefined" ? `${window.location.origin}/posts/${slug}` : "";

  const share = (platform: "twitter" | "linkedin") => {
    const urls = {
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    };
    window.open(urls[platform], "_blank", "width=600,height=400");
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const btnClass = "p-2 rounded-lg border border-[var(--color-border)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-colors";

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-[var(--color-text-muted)] mr-2">Share:</span>
      <button onClick={() => share("twitter")} className={btnClass} aria-label="Share on Twitter">
        <Twitter size={18} />
      </button>
      <button onClick={() => share("linkedin")} className={btnClass} aria-label="Share on LinkedIn">
        <Linkedin size={18} />
      </button>
      <button onClick={copyLink} className={btnClass} aria-label="Copy link">
        {copied ? <Check size={18} className="text-green-500" /> : <Link2 size={18} />}
      </button>
    </div>
  );
}
