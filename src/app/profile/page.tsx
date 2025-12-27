"use client";

import { useUser } from "@auth0/nextjs-auth0/client";
import Image from "next/image";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { SettingsLayout } from "@/components/ui/SettingsLayout";
import { Bookmark, Calendar, BookOpen, Flame, ExternalLink, Edit2 } from "lucide-react";
import { useImpersonation } from "@/app/providers";

export default function ProfilePage() {
  const { user, isLoading } = useUser();
  const { isImpersonating, impersonatedUserId } = useImpersonation();
  
  const queryArgs = user 
    ? (isImpersonating ? { asUserId: impersonatedUserId! } : {})
    : "skip";
  
  const bookmarks = useQuery(api.bookmarks.getBookmarkedPosts, queryArgs);
  const profile = useQuery(api.userProfiles.get, queryArgs);

  if (isLoading) {
    return (
      <SettingsLayout>
        <div className="animate-pulse space-y-6">
          <div className="h-32 bg-[var(--color-border)]/30 rounded-2xl" />
          <div className="flex flex-col items-center -mt-16">
            <div className="w-24 h-24 rounded-full bg-[var(--color-border)]/50" />
            <div className="h-6 w-32 bg-[var(--color-border)]/30 rounded mt-4" />
            <div className="h-4 w-48 bg-[var(--color-border)]/30 rounded mt-2" />
          </div>
        </div>
      </SettingsLayout>
    );
  }

  if (!user) {
    return (
      <SettingsLayout>
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-16 h-16 rounded-full bg-[var(--color-border)]/30 flex items-center justify-center">
            <BookOpen size={32} className="text-[var(--color-text-muted)]" />
          </div>
          <p className="text-[var(--color-text-muted)]">Please sign in to view your profile</p>
          <a
            href="/auth/login"
            className="px-6 py-2.5 bg-[var(--color-primary)] text-white rounded-xl hover:opacity-90 transition-opacity font-medium"
          >
            Sign in
          </a>
        </div>
      </SettingsLayout>
    );
  }

  const joinDate = new Date(user.updated_at || Date.now()).toLocaleDateString("en-US", { 
    month: "long", 
    year: "numeric" 
  });

  const stats = profile?.stats || {};
  const articlesRead = stats.articlesRead || 0;
  const readingStreak = stats.readingStreak || 0;

  return (
    <SettingsLayout>
      {/* Hero Section */}
      <div className="relative mb-16">
        <div className="h-32 rounded-2xl bg-gradient-to-br from-[var(--color-primary)]/20 via-[var(--color-primary)]/10 to-transparent" />
        
        <div className="absolute -bottom-12 left-1/2 -translate-x-1/2">
          <div className="relative group">
            {user.picture ? (
              <Image
                src={user.picture}
                alt={user.name || ""}
                width={96}
                height={96}
                className="rounded-full border-4 border-[var(--color-surface)]"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-[var(--color-primary)] flex items-center justify-center text-white text-3xl font-medium border-4 border-[var(--color-surface)]">
                {(user.name?.[0] || user.email?.[0] || "?").toUpperCase()}
              </div>
            )}
            <button className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Edit2 size={20} className="text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* Profile Info */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-2 mb-1">
          <h1 className="text-2xl font-bold">{user.name || "User"}</h1>
          {user.email_verified && (
            <span className="px-2 py-0.5 text-xs bg-[var(--color-primary)]/10 text-[var(--color-primary)] rounded-full">
              Verified
            </span>
          )}
        </div>
        <p className="text-[var(--color-text-muted)]">{user.email}</p>
        
        {profile?.bio && (
          <p className="mt-3 text-sm max-w-md mx-auto">{profile.bio}</p>
        )}

        {(profile?.website || profile?.twitter) && (
          <div className="flex items-center justify-center gap-4 mt-3">
            {profile.website && (
              <a 
                href={profile.website} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-[var(--color-primary)] hover:underline flex items-center gap-1"
              >
                Website <ExternalLink size={12} />
              </a>
            )}
            {profile.twitter && (
              <a 
                href={`https://twitter.com/${profile.twitter}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-[var(--color-primary)] hover:underline flex items-center gap-1"
              >
                @{profile.twitter} <ExternalLink size={12} />
              </a>
            )}
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <div className="p-4 rounded-xl border border-[var(--color-border)] text-center">
          <Bookmark size={20} className="mx-auto mb-2 text-[var(--color-text-muted)]" />
          <p className="text-2xl font-bold">{bookmarks?.length ?? 0}</p>
          <p className="text-xs text-[var(--color-text-muted)]">Bookmarks</p>
        </div>
        <div className="p-4 rounded-xl border border-[var(--color-border)] text-center">
          <BookOpen size={20} className="mx-auto mb-2 text-[var(--color-text-muted)]" />
          <p className="text-2xl font-bold">{articlesRead}</p>
          <p className="text-xs text-[var(--color-text-muted)]">Articles Read</p>
        </div>
        <div className="p-4 rounded-xl border border-[var(--color-border)] text-center">
          <Flame size={20} className="mx-auto mb-2 text-[var(--color-text-muted)]" />
          <p className="text-2xl font-bold">{readingStreak}</p>
          <p className="text-xs text-[var(--color-text-muted)]">Day Streak</p>
        </div>
        <div className="p-4 rounded-xl border border-[var(--color-border)] text-center">
          <Calendar size={20} className="mx-auto mb-2 text-[var(--color-text-muted)]" />
          <p className="text-sm font-medium">{joinDate}</p>
          <p className="text-xs text-[var(--color-text-muted)]">Member Since</p>
        </div>
      </div>

      {/* Recent Bookmarks */}
      {bookmarks && bookmarks.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
              Recent Bookmarks
            </h2>
            <Link 
              href="/bookmarks" 
              className="text-sm text-[var(--color-primary)] hover:underline"
            >
              View all
            </Link>
          </div>
          <div className="space-y-2">
            {bookmarks.slice(0, 3).map((post: any) => (
              <Link
                key={post.slug}
                href={`/posts/${post.slug}`}
                className="flex items-center gap-3 p-3 rounded-xl border border-[var(--color-border)] hover:bg-[var(--color-accent)]/30 transition-colors"
              >
                {post.featuredImage?.url && (
                  <Image
                    src={post.featuredImage.url}
                    alt={post.title}
                    width={48}
                    height={48}
                    className="rounded-lg object-cover"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{post.title}</p>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    {post.readingTime} min read
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </SettingsLayout>
  );
}
