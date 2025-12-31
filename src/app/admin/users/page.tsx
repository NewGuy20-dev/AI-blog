"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useState } from "react";
import { Shield, ShieldOff, UserPlus, Search, Users } from "lucide-react";
import { ORIGINAL_ADMIN_ID } from "@/lib/admin";
import { GlassCard } from "@/components/admin/GlassCard";
import { GlassButton } from "@/components/admin/GlassButton";

export default function AdminUsersPage() {
  const users = useQuery(api.admin.listUsers, { limit: 100 });
  const admins = useQuery(api.admin.listAdmins);
  const addAdmin = useMutation(api.admin.addAdmin);
  const removeAdmin = useMutation(api.admin.removeAdmin);
  const [search, setSearch] = useState("");
  const [newAdminId, setNewAdminId] = useState("");
  const [masterKey, setMasterKey] = useState("");

  const filteredUsers = users?.filter(u => u.userId.toLowerCase().includes(search.toLowerCase()));
  const isUserAdmin = (userId: string) => userId === ORIGINAL_ADMIN_ID || admins?.some(a => a.userId === userId);

  const handleAddAdmin = async () => {
    if (!newAdminId.trim() || !masterKey.trim()) return alert("User ID and Master Key required");
    const result = await addAdmin({ userId: newAdminId.trim(), masterKey: masterKey.trim() });
    alert(result.message);
    if (result.success) setNewAdminId("");
  };

  const handleToggleAdmin = async (userId: string) => {
    if (!masterKey.trim()) return alert("Master Key required");
    if (isUserAdmin(userId)) {
      if (userId === ORIGINAL_ADMIN_ID) return alert("Cannot remove the original admin");
      if (confirm(`Remove admin privileges from ${userId}?`)) {
        const result = await removeAdmin({ userId, masterKey: masterKey.trim() });
        alert(result.message);
      }
    } else {
      if (confirm(`Grant admin privileges to ${userId}?`)) {
        const result = await addAdmin({ userId, masterKey: masterKey.trim() });
        alert(result.message);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-3">
          <Users className="text-violet-400" />
          Users & Admins
        </h1>
        <p className="text-white/50 text-sm">Manage user accounts and admin privileges</p>
      </div>

      {/* Add Admin */}
      <GlassCard>
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <UserPlus size={18} className="text-green-400" />
          Add Admin by User ID
        </h2>
        <div className="space-y-2">
          <input
            type="text"
            placeholder="google-oauth2|123456789..."
            value={newAdminId}
            onChange={(e) => setNewAdminId(e.target.value)}
            className="glass-input w-full px-4 py-2 font-mono text-sm"
          />
          <input
            type="password"
            placeholder="256-char Master Key"
            value={masterKey}
            onChange={(e) => setMasterKey(e.target.value)}
            className="glass-input w-full px-4 py-2 font-mono text-sm"
          />
          <GlassButton onClick={handleAddAdmin}>Add Admin</GlassButton>
        </div>
      </GlassCard>

      {/* Current Admins */}
      <GlassCard>
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <Shield size={18} className="text-yellow-400" />
          Current Admins
        </h2>
        <div className="space-y-2">
          {admins?.map((admin) => (
            <div key={admin.userId} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
              <div>
                <p className="font-mono text-sm">{admin.userId}</p>
                {admin.isOriginal && <span className="text-xs text-yellow-400">Original Admin (Protected)</span>}
              </div>
              {!admin.isOriginal && (
                <GlassButton variant="danger" size="sm" onClick={() => handleToggleAdmin(admin.userId)}>
                  <ShieldOff size={14} />
                </GlassButton>
              )}
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
        <input
          type="text"
          placeholder="Search users by ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="glass-input w-full pl-10 pr-4 py-2"
        />
      </div>

      {/* Users Table */}
      <GlassCard padding="sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left px-4 py-3 text-sm font-medium text-white/50">User ID</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-white/50">Bio</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-white/50">Admin</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-white/50">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers?.map((user, idx) => (
                <tr key={user._id + '-' + idx} className="border-b border-white/5 hover:bg-white/5">
                  <td className="px-4 py-3 font-mono text-sm truncate max-w-xs">{user.userId}</td>
                  <td className="px-4 py-3 text-sm text-white/50">{user.bio || "-"}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs rounded-full ${isUserAdmin(user.userId) ? "bg-green-500/20 text-green-400" : "bg-white/10 text-white/50"}`}>
                      {isUserAdmin(user.userId) ? "Admin" : "User"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <GlassButton
                      variant={isUserAdmin(user.userId) ? "danger" : "primary"}
                      size="sm"
                      onClick={() => handleToggleAdmin(user.userId)}
                    >
                      {isUserAdmin(user.userId) ? <ShieldOff size={14} /> : <Shield size={14} />}
                    </GlassButton>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!users && <div className="text-center py-8 text-white/50">Loading...</div>}
          {filteredUsers?.length === 0 && <div className="text-center py-8 text-white/50">No users found</div>}
        </div>
      </GlassCard>
    </div>
  );
}
