"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useState } from "react";
import { Shield, ShieldOff, UserPlus, Search } from "lucide-react";
import { ORIGINAL_ADMIN_ID } from "@/lib/admin";

export default function AdminUsersPage() {
  const users = useQuery(api.admin.listUsers, { limit: 100 });
  const admins = useQuery(api.admin.listAdmins);
  const addAdmin = useMutation(api.admin.addAdmin);
  const removeAdmin = useMutation(api.admin.removeAdmin);
  const [search, setSearch] = useState("");
  const [newAdminId, setNewAdminId] = useState("");

  const filteredUsers = users?.filter(u => 
    u.userId.toLowerCase().includes(search.toLowerCase())
  );

  const isUserAdmin = (userId: string) => {
    if (userId === ORIGINAL_ADMIN_ID) return true;
    return admins?.some(a => a.userId === userId);
  };

  const handleAddAdmin = async () => {
    if (!newAdminId.trim()) return;
    const result = await addAdmin({ userId: newAdminId.trim() });
    alert(result.message);
    if (result.success) setNewAdminId("");
  };

  const handleToggleAdmin = async (userId: string) => {
    if (isUserAdmin(userId)) {
      if (userId === ORIGINAL_ADMIN_ID) {
        alert("Cannot remove the original admin");
        return;
      }
      if (confirm(`Remove admin privileges from ${userId}?`)) {
        const result = await removeAdmin({ userId });
        alert(result.message);
      }
    } else {
      if (confirm(`Grant admin privileges to ${userId}?`)) {
        const result = await addAdmin({ userId });
        alert(result.message);
      }
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-8">Users & Admins</h1>

      {/* Add Admin */}
      <div className="bg-[#161b22] rounded-xl border border-[#30363d] p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <UserPlus size={20} className="text-green-500" />
          Add Admin by User ID
        </h2>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="google-oauth2|123456789..."
            value={newAdminId}
            onChange={(e) => setNewAdminId(e.target.value)}
            className="flex-1 px-4 py-2 bg-[#21262d] border border-[#30363d] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-green-500 font-mono text-sm"
          />
          <button
            onClick={handleAddAdmin}
            className="px-4 py-2 bg-green-500 text-black font-medium rounded-lg hover:bg-green-400 transition-colors"
          >
            Add Admin
          </button>
        </div>
      </div>

      {/* Current Admins */}
      <div className="bg-[#161b22] rounded-xl border border-[#30363d] p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Shield size={20} className="text-yellow-500" />
          Current Admins
        </h2>
        <div className="space-y-2">
          {admins?.map((admin) => (
            <div
              key={admin.userId}
              className="flex items-center justify-between p-3 bg-[#21262d] rounded-lg"
            >
              <div>
                <p className="font-mono text-sm">{admin.userId}</p>
                {admin.isOriginal && (
                  <span className="text-xs text-yellow-500">Original Admin (Protected)</span>
                )}
              </div>
              {!admin.isOriginal && (
                <button
                  onClick={() => handleToggleAdmin(admin.userId)}
                  className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                >
                  <ShieldOff size={16} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <input
          type="text"
          placeholder="Search users by ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-[#161b22] border border-[#30363d] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-green-500"
        />
      </div>

      {/* Users Table */}
      <div className="bg-[#161b22] rounded-xl border border-[#30363d] overflow-hidden">
        <table className="w-full">
          <thead className="bg-[#21262d]">
            <tr>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">User ID</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Bio</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Admin</th>
              <th className="text-right px-4 py-3 text-sm font-medium text-gray-400">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers?.map((user) => (
              <tr key={user._id} className="border-t border-[#30363d] hover:bg-[#21262d]">
                <td className="px-4 py-3">
                  <p className="font-mono text-sm truncate max-w-xs">{user.userId}</p>
                </td>
                <td className="px-4 py-3 text-sm text-gray-400">{user.bio || "-"}</td>
                <td className="px-4 py-3">
                  {isUserAdmin(user.userId) ? (
                    <span className="px-2 py-1 text-xs bg-green-500/20 text-green-400 rounded-full">
                      Admin
                    </span>
                  ) : (
                    <span className="px-2 py-1 text-xs bg-gray-500/20 text-gray-400 rounded-full">
                      User
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end">
                    <button
                      onClick={() => handleToggleAdmin(user.userId)}
                      className={`p-2 rounded-lg transition-colors ${
                        isUserAdmin(user.userId)
                          ? "text-red-400 hover:bg-red-500/10"
                          : "text-green-400 hover:bg-green-500/10"
                      }`}
                    >
                      {isUserAdmin(user.userId) ? <ShieldOff size={16} /> : <Shield size={16} />}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {!users && (
          <div className="text-center py-8 text-gray-500">Loading...</div>
        )}
        
        {filteredUsers?.length === 0 && (
          <div className="text-center py-8 text-gray-500">No users found</div>
        )}
      </div>
    </div>
  );
}
