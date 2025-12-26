"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useState } from "react";
import { Trash2, Archive, Eye, Search } from "lucide-react";

export default function AdminPostsPage() {
  const posts = useQuery(api.admin.listPosts, { limit: 100 });
  const archiveAll = useMutation(api.admin.archiveAllPosts);
  const deleteArticle = useMutation(api.admin.deleteArticle);
  const [search, setSearch] = useState("");

  const filteredPosts = posts?.filter(p => 
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    p.slug.toLowerCase().includes(search.toLowerCase())
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
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Posts</h1>
        <button
          onClick={handleArchiveAll}
          className="flex items-center gap-2 px-4 py-2 bg-yellow-500/20 text-yellow-400 rounded-lg hover:bg-yellow-500/30 transition-colors"
        >
          <Archive size={16} />
          Archive All
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <input
          type="text"
          placeholder="Search posts..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-[#161b22] border border-[#30363d] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-green-500"
        />
      </div>

      {/* Posts Table */}
      <div className="bg-[#161b22] rounded-xl border border-[#30363d] overflow-hidden">
        <table className="w-full">
          <thead className="bg-[#21262d]">
            <tr>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Title</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Slug</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Status</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">Category</th>
              <th className="text-right px-4 py-3 text-sm font-medium text-gray-400">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredPosts?.map((post) => (
              <tr key={post._id} className="border-t border-[#30363d] hover:bg-[#21262d]">
                <td className="px-4 py-3">
                  <p className="font-medium truncate max-w-xs">{post.title}</p>
                </td>
                <td className="px-4 py-3 text-sm text-gray-400 font-mono">{post.slug}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    post.status === "published" ? "bg-green-500/20 text-green-400" :
                    post.status === "draft" ? "bg-yellow-500/20 text-yellow-400" :
                    post.status === "archived" ? "bg-gray-500/20 text-gray-400" :
                    "bg-red-500/20 text-red-400"
                  }`}>
                    {post.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-400">{post.category || "-"}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <a
                      href={`/posts/${post.slug}`}
                      target="_blank"
                      className="p-2 text-gray-400 hover:text-white hover:bg-[#30363d] rounded-lg transition-colors"
                    >
                      <Eye size={16} />
                    </a>
                    <button
                      onClick={() => handleDelete(post.title)}
                      className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {!posts && (
          <div className="text-center py-8 text-gray-500">Loading...</div>
        )}
        
        {filteredPosts?.length === 0 && (
          <div className="text-center py-8 text-gray-500">No posts found</div>
        )}
      </div>
    </div>
  );
}
