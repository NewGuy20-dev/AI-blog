"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useState } from "react";
import { Trash2, Archive, Eye, Search, FileText } from "lucide-react";
import { GlassCard } from "@/components/admin/GlassCard";
import { GlassButton } from "@/components/admin/GlassButton";

export default function AdminPostsPage() {
  const posts = useQuery(api.admin.listPosts, { limit: 100 });
  const archiveAll = useMutation(api.admin.archiveAllPosts);
  const deleteArticle = useMutation(api.admin.deleteArticle);
  const [search, setSearch] = useState("");

  const filteredPosts = posts?.filter(p => 
    p.title.toLowerCase().includes(search.toLowerCase()) || p.slug.toLowerCase().includes(search.toLowerCase())
  );

  const handleArchiveAll = async () => {
    if (confirm("Archive all published posts?")) {
      const result = await archiveAll();
      alert(`Archived ${result.archived} posts`);
    }
  };

  const handleDelete = async (title: string) => {
    if (confirm(`Delete "${title}"?`)) {
      const result = await deleteArticle({ title });
      alert(result.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <FileText className="text-violet-400" />
            Posts
          </h1>
          <p className="text-white/50 text-sm">Manage blog posts</p>
        </div>
        <GlassButton variant="secondary" onClick={handleArchiveAll}>
          <Archive size={16} className="mr-2" />
          Archive All
        </GlassButton>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
        <input
          type="text"
          placeholder="Search posts..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="glass-input w-full pl-10 pr-4 py-2"
        />
      </div>

      {/* Posts Table */}
      <GlassCard padding="sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left px-4 py-3 text-sm font-medium text-white/50">Title</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-white/50">Slug</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-white/50">Status</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-white/50">Category</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-white/50">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPosts?.map((post) => (
                <tr key={post._id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="px-4 py-3">
                    <p className="font-medium truncate max-w-xs">{post.title}</p>
                  </td>
                  <td className="px-4 py-3 text-sm text-white/50 font-mono">{post.slug}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      post.status === "published" ? "bg-green-500/20 text-green-400" :
                      post.status === "draft" ? "bg-yellow-500/20 text-yellow-400" :
                      post.status === "archived" ? "bg-white/10 text-white/50" : "bg-red-500/20 text-red-400"
                    }`}>{post.status}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-white/50">{post.category || "-"}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <a href={`/posts/${post.slug}`} target="_blank" className="p-2 text-white/40 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                        <Eye size={16} />
                      </a>
                      <button onClick={() => handleDelete(post.title)} className="p-2 text-white/40 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!posts && <div className="text-center py-8 text-white/50">Loading...</div>}
          {filteredPosts?.length === 0 && <div className="text-center py-8 text-white/50">No posts found</div>}
        </div>
      </GlassCard>
    </div>
  );
}
