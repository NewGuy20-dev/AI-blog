"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { formatDistanceToNow } from "date-fns";
import { HeadphonesIcon, User, Clock, Play } from "lucide-react";
import { useImpersonation } from "@/app/providers";
import { useRouter } from "next/navigation";
import { GlassCard } from "@/components/admin/GlassCard";
import { GlassButton } from "@/components/admin/GlassButton";

export default function AdminSupportPage() {
  const grants = useQuery(api.supportAccess.listGrantedAccess);
  const { startImpersonation } = useImpersonation();
  const router = useRouter();

  const handleImpersonate = (userId: string) => {
    startImpersonation(userId);
    router.push('/feed');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-3">
          <HeadphonesIcon className="text-green-400" />
          Support Access
        </h1>
        <p className="text-white/50 text-sm">Users who have granted temporary support access</p>
      </div>

      {!grants ? (
        <div className="text-center py-12 text-white/50">Loading...</div>
      ) : grants.length === 0 ? (
        <GlassCard className="text-center py-12">
          <HeadphonesIcon size={48} className="mx-auto mb-4 text-white/30" />
          <p className="text-white/50">No users have granted support access</p>
        </GlassCard>
      ) : (
        <div className="space-y-3">
          {grants.map((grant: any) => (
            <GlassCard key={grant._id} padding="sm">
              <div className="flex items-center justify-between p-2">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                    <User size={20} className="text-green-400" />
                  </div>
                  <div>
                    <p className="font-medium font-mono text-sm">{grant.userId}</p>
                    <p className="text-xs text-white/40 flex items-center gap-2 mt-1">
                      <Clock size={12} />
                      Expires {formatDistanceToNow(grant.expiresAt, { addSuffix: true })}
                    </p>
                    {grant.reason && <p className="text-xs text-white/50 mt-1">Reason: {grant.reason}</p>}
                  </div>
                </div>
                <GlassButton onClick={() => handleImpersonate(grant.userId)}>
                  <Play size={14} className="mr-2" />
                  Impersonate
                </GlassButton>
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}
