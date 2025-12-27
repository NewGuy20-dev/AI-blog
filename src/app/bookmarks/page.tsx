"use client";

import { useQuery } from "convex/react";
import { useUser } from "@auth0/nextjs-auth0/client";
import { api } from "../../../convex/_generated/api";
import { ArticleCard } from "@/components/ui/ArticleCard";
import { useBookmarks } from "@/lib/hooks/useBookmarks";
import { SettingsLayout } from "@/components/ui/SettingsLayout";
import { Bookmark, Trash2 } from "lucide-react";
import Link from "next/link";
import { useImpersonation } from "@/app/providers";

export default function BookmarksPage() {
  const { user } = useUser();
  const { isImpersonating, impersonatedUserId } = useImpersonation();
  const isSignedIn = !!user;
  const { bookmarks, clear, count } = useBookmarks();
  
  const queryArgs = isSignedIn 
    ? (isImpersonating ? { asUserId: impersonatedUserId! } : {})
    : "skip";
  
  const convexPosts = useQuery(api.bookmarks.getBookmarkedPosts, queryArgs);
  
  const allPosts = useQuery(api.posts.list, !isSignedIn ? { limit: 100 } : "skip");
  
  const bookmarkedPosts = isSignedIn 
    ? (convexPosts?.filter(Boolean) ?? [])
    : (allPosts?.filter((p) => bookmarks.includes(p.slug)) ?? []);

  const isLoading = isSignedIn ? convexPosts === undefined : allPosts === undefined;

  return (
    <SettingsLayout>
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-[var(--color-primary)]/10">
            <Bookmark size={24} strokeWidth={1.5} className="text-[var(--color-primary)]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Bookmarks</h1>
            <p className="text-sm text-[var(--color-text-muted)]">
              {count === 0 ? "No saved articles" : `${count} saved article${count !== 1 ? "s" : ""}`}
            </p>
          </div>
        </div>
        
        {count > 0 && (
          <button
            onClick={clear}
            className="flex items-center gap-2 px-4 py-2 text-sm text-[var(--color-text-muted)] hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
          >
            <Trash2 size={16} strokeWidth={1.5} />
            Clear all
          </button>
        )}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-48 rounded-xl bg-[var(--color-border)]/30 animate-pulse" />
          ))}
        </div>
      ) : bookmarkedPosts.length === 0 ? (
        <div className="py-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[var(--color-border)]/30 flex items-center justify-center mx-auto mb-6">
            <Bookmark size={28} strokeWidth={1.5} className="text-[var(--color-text-muted)]" />
          </div>
          <p className="text-[var(--color-text-muted)] mb-6">
            {isSignedIn 
              ? "Articles you bookmark will appear here"
              : "Sign in to sync bookmarks across devices"
            }
          </p>
          <Link 
            href="/feed" 
            className="inline-flex px-6 py-2.5 text-sm font-medium bg-[var(--color-primary)] text-white rounded-xl hover:opacity-90 transition-opacity"
          >
            Browse articles
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {bookmarkedPosts.map((post) => post && (
            <ArticleCard key={post._id} post={post} />
          ))}
        </div>
      )}
    </SettingsLayout>
  );
}
