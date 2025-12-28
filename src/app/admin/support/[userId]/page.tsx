"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { useParams, useRouter } from "next/navigation";
import { AlertTriangle, ArrowLeft, User, Bookmark, Settings, Eye } from "lucide-react";
import Link from "next/link";
import { useImpersonation } from "@/app/providers";

export default function ImpersonateUserPage() {
  const params = useParams();
  const router = useRouter();
  const { startImpersonation } = useImpersonation();
  const userId = decodeURIComponent(params.userId as string);
  
  const canAccess = useQuery(api.supportAccess.canAccessUser, { targetUserId: userId });
  const userProfile = useQuery(api.userProfiles.get, canAccess ? { asUserId: userId } : "skip");
  const userBookmarks = useQuery(api.bookmarks.getUserBookmarks, canAccess ? { asUserId: userId } : "skip");

  if (canAccess === false) {
    return (
      <div className="p-8">
        <div className="max-w-lg mx-auto text-center py-12">
          <AlertTriangle size={48} className="mx-auto mb-4 text-red-500" />
          <h1 className="text-xl font-bold mb-2">Access Denied</h1>
          <p className="text-gray-400 mb-6">
            This user has not granted support access or their access has expired.
          </p>
          <Link href="/admin/support" className="text-green-400 hover:underline">
            ← Back to Support Access
          </Link>
        </div>
      </div>
    );
  }

  if (canAccess === undefined) {
    return <div className="p-8 text-gray-500">Verifying access...</div>;
  }

  const handleImpersonate = () => {
    startImpersonation(userId);
    router.push("/feed");
  };

  return (
    <div className="p-8">
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="text-gray-400 hover:text-white flex items-center gap-2 mb-4"
        >
          <ArrowLeft size={16} /> Back
        </button>
        
        <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg mb-6">
          <p className="text-yellow-500 text-sm flex items-center gap-2">
            <AlertTriangle size={16} />
            You are viewing this account with support access.
          </p>
        </div>

        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <User className="text-green-500" />
            User: {userId.slice(0, 30)}...
          </h1>
          <button
            onClick={handleImpersonate}
            className="flex items-center gap-2 px-4 py-2 bg-yellow-500 text-black rounded-lg font-medium hover:bg-yellow-400"
          >
            <Eye size={16} /> Browse as User
          </button>
        </div>
      </div>

      <div className="grid gap-6">
        <section className="p-6 bg-[#161b22] rounded-lg border border-[#30363d]">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Settings size={18} /> Profile
          </h2>
          {userProfile ? (
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Bio</span>
                <span>{userProfile.bio || "Not set"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Website</span>
                <span>{userProfile.website || "Not set"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Theme</span>
                <span>{userProfile.preferences?.theme || "Default"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Created</span>
                <span>{new Date(userProfile.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          ) : (
            <p className="text-gray-500">No profile data</p>
          )}
        </section>

        <section className="p-6 bg-[#161b22] rounded-lg border border-[#30363d]">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Bookmark size={18} /> Bookmarks ({userBookmarks?.length || 0})
          </h2>
          {userBookmarks && userBookmarks.length > 0 ? (
            <ul className="space-y-2 text-sm">
              {userBookmarks.map((slug: string) => (
                <li key={slug} className="text-gray-300">{slug}</li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">No bookmarks</p>
          )}
        </section>
      </div>
    </div>
  );
}
