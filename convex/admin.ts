import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const HARDCODED_ADMIN_IDS = [
  "google-oauth2|101765812180352599429",
  "google-oauth2|103430903957817165722",
];

// Helper to check if user is admin
async function isAdmin(ctx: any): Promise<boolean> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return false;
  
  // Hardcoded admins always have access
  if (HARDCODED_ADMIN_IDS.includes(identity.subject)) return true;
  
  // Check admins table
  const admin = await ctx.db
    .query("admins")
    .withIndex("by_userId", (q: any) => q.eq("userId", identity.subject))
    .first();
  
  return !!admin;
}

async function requireAdmin(ctx: any) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Not authenticated");
  
  const admin = await isAdmin(ctx);
  if (!admin) throw new Error("Not authorized");
  
  return identity;
}

// Check if current user is admin
export const checkAdmin = query({
  args: {},
  handler: async (ctx) => {
    return await isAdmin(ctx);
  },
});

// Get system stats
export const getStats = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    
    const posts = await ctx.db.query("posts").collect();
    const users = await ctx.db.query("userProfiles").collect();
    const bookmarks = await ctx.db.query("bookmarks").collect();
    const admins = await ctx.db.query("admins").collect();
    
    return {
      posts: {
        total: posts.length,
        published: posts.filter(p => p.status === "published").length,
        draft: posts.filter(p => p.status === "draft").length,
        archived: posts.filter(p => p.status === "archived").length,
      },
      users: users.length,
      bookmarks: bookmarks.length,
      admins: admins.length + 1, // +1 for original admin
    };
  },
});

// List all posts for admin
export const listPosts = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    
    const posts = await ctx.db
      .query("posts")
      .order("desc")
      .take(args.limit || 50);
    
    return posts;
  },
});

// Archive all posts
export const archiveAllPosts = mutation({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    
    const posts = await ctx.db
      .query("posts")
      .filter(q => q.eq(q.field("status"), "published"))
      .collect();
    
    for (const post of posts) {
      await ctx.db.patch(post._id, { status: "archived" });
    }
    
    return { archived: posts.length };
  },
});

// Delete article by title
export const deleteArticle = mutation({
  args: { title: v.string() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    
    const posts = await ctx.db.query("posts").collect();
    const post = posts.find(p => 
      p.title.toLowerCase().includes(args.title.toLowerCase())
    );
    
    if (!post) {
      return { success: false, message: `Article "${args.title}" not found` };
    }
    
    await ctx.db.delete(post._id);
    return { success: true, message: `Deleted: ${post.title}` };
  },
});

// Publish a post by slug
export const publishPost = mutation({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    
    const post = await ctx.db
      .query("posts")
      .withIndex("by_slug", q => q.eq("slug", args.slug))
      .first();
    
    if (!post) {
      return { success: false, message: `Post "${args.slug}" not found` };
    }
    
    await ctx.db.patch(post._id, { status: "published" });
    return { success: true, message: `Published: ${post.title}` };
  },
});

// List admins
export const listAdmins = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    
    const admins = await ctx.db.query("admins").collect();
    const hardcodedAdmins = HARDCODED_ADMIN_IDS.map(id => ({
      userId: id,
      isOriginal: true,
      addedAt: 0,
    }));
    return [...hardcodedAdmins, ...admins];
  },
});

// Add admin
export const addAdmin = mutation({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const identity = await requireAdmin(ctx);
    
    // Check if already hardcoded admin
    if (HARDCODED_ADMIN_IDS.includes(args.userId)) {
      return { success: false, message: "User is already a hardcoded admin" };
    }
    
    const existing = await ctx.db
      .query("admins")
      .withIndex("by_userId", q => q.eq("userId", args.userId))
      .first();
    
    if (existing) {
      return { success: false, message: "User is already an admin" };
    }
    
    await ctx.db.insert("admins", {
      userId: args.userId,
      addedBy: identity.subject,
      addedAt: Date.now(),
      isOriginal: false,
    });
    
    return { success: true, message: `Added admin: ${args.userId}` };
  },
});

// Remove admin
export const removeAdmin = mutation({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    
    // Cannot remove hardcoded admins
    if (HARDCODED_ADMIN_IDS.includes(args.userId)) {
      return { success: false, message: "Cannot remove a hardcoded admin" };
    }
    
    const admin = await ctx.db
      .query("admins")
      .withIndex("by_userId", q => q.eq("userId", args.userId))
      .first();
    
    if (!admin) {
      return { success: false, message: "User is not an admin" };
    }
    
    await ctx.db.delete(admin._id);
    return { success: true, message: `Removed admin: ${args.userId}` };
  },
});

// Get audit logs
export const getAuditLogs = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    
    return await ctx.db
      .query("audit")
      .order("desc")
      .take(args.limit || 20);
  },
});

// List users
export const listUsers = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    
    return await ctx.db
      .query("userProfiles")
      .order("desc")
      .take(args.limit || 50);
  },
});
