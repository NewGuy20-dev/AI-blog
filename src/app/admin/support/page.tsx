"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { formatDistanceToNow } from "date-fns";
import { HeadphonesIcon, User, Clock, ExternalLink } from "lucide-react";
import Link from "next/link";

export default function AdminSupportPage() {
  const grants = useQuery(api.supportAccess.listGrantedAccess);

  return (
    <div className="p-8">
      <div className="flex items-center gap-3 mb-6">
        <HeadphonesIcon className="text-green-500" />
        <h1 className="text-2xl font-bold">Support Access</h1>
      </div>

      <p className="text-gray-400 mb-6">
        Users who have granted temporary support access to their accounts.
      </p>

      {!grants ? (
        <div className="text-gray-500">Loading...</div>
      ) : grants.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <HeadphonesIcon size={48} className="mx-auto mb-4 opacity-50" />
          <p>No users have granted support access</p>
        </div>
      ) : (
        <div className="space-y-3">
          {grants.map((grant: any) => (
            <div
              key={grant._id}
              className="p-4 bg-[#161b22] rounded-lg border border-[#30363d] flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                  <User size={20} className="text-green-500" />
                </div>
                <div>
                  <p className="font-medium font-mono text-sm">{grant.userId}</p>
                  <p className="text-xs text-gray-500 flex items-center gap-2 mt-1">
                    <Clock size={12} />
                    Expires {formatDistanceToNow(grant.expiresAt, { addSuffix: true })}
                  </p>
                  {grant.reason && (
                    <p className="text-xs text-gray-400 mt-1">Reason: {grant.reason}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href={`/admin/support/${encodeURIComponent(grant.userId)}`}
                  className="px-4 py-2 text-sm bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors flex items-center gap-2"
                >
                  View as User
                  <ExternalLink size={14} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
