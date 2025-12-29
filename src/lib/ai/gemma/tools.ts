import { z } from "zod";

// Tool schemas
export const GoogleSearchArgsSchema = z.object({
  tool: z.literal("google_search"),
  query: z.string(),
  num: z.number().min(1).max(10).optional(),
});

export const OpenverseArgsSchema = z.object({
  tool: z.literal("openverse_image"),
  query: z.string(),
  license_type: z.enum(["commercial", "modification"]).optional(),
});

export const ToolCallSchema = z.discriminatedUnion("tool", [GoogleSearchArgsSchema, OpenverseArgsSchema]);

export type ToolCall = z.infer<typeof ToolCallSchema>;
export type GoogleSearchArgs = z.infer<typeof GoogleSearchArgsSchema>;
export type OpenverseArgs = z.infer<typeof OpenverseArgsSchema>;

// Tool results
export interface GoogleSearchResult {
  results: { title: string; url: string; snippet: string }[];
}

export interface OpenverseResult {
  images: { title: string; url: string; creator: string; license: string }[];
}

export type ToolResult = { tool: string; success: true; data: GoogleSearchResult | OpenverseResult } 
                       | { tool: string; success: false; error: string };

// Google Custom Search executor
export async function executeGoogleSearch(args: GoogleSearchArgs): Promise<ToolResult> {
  const apiKey = process.env.GOOGLE_CSE_API_KEY;
  const cx = process.env.GOOGLE_CSE_ID;
  
  if (!apiKey || !cx) {
    return { tool: "google_search", success: false, error: "GOOGLE_CSE_API_KEY or GOOGLE_CSE_ID not set" };
  }

  try {
    const params = new URLSearchParams({
      key: apiKey,
      cx: cx,
      q: args.query,
      num: String(args.num || 5),
    });
    
    const res = await fetch(`https://www.googleapis.com/customsearch/v1?${params}`);
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error?.message || res.statusText);
    }
    
    const data = await res.json();
    
    return {
      tool: "google_search",
      success: true,
      data: {
        results: (data.items || []).map((item: any) => ({
          title: item.title,
          url: item.link,
          snippet: item.snippet,
        })),
      },
    };
  } catch (e: any) {
    return { tool: "google_search", success: false, error: e.message };
  }
}

let openverseToken: { token: string; expires: number } | null = null;

async function getOpenverseToken(): Promise<string> {
  if (openverseToken && Date.now() < openverseToken.expires) return openverseToken.token;

  const res = await fetch("https://api.openverse.org/v1/auth_tokens/token/", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.OPENVERSE_CLIENT_ID!,
      client_secret: process.env.OPENVERSE_CLIENT_SECRET!,
      grant_type: "client_credentials",
    }),
  });
  if (!res.ok) throw new Error("Failed to get Openverse token");
  const data = await res.json();
  openverseToken = { token: data.access_token, expires: Date.now() + (data.expires_in - 60) * 1000 };
  return openverseToken.token;
}

export async function executeOpenverse(args: OpenverseArgs): Promise<ToolResult> {
  if (!process.env.OPENVERSE_CLIENT_ID) return { tool: "openverse_image", success: false, error: "OPENVERSE_CLIENT_ID not set" };

  try {
    const token = await getOpenverseToken();
    const params = new URLSearchParams({
      q: args.query,
      license_type: args.license_type || "commercial",
      page_size: "5",
    });
    const res = await fetch(`https://api.openverse.org/v1/images/?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error(res.statusText);
    const data = await res.json();
    return {
      tool: "openverse_image",
      success: true,
      data: {
        images: data.results.slice(0, 5).map((r: any) => ({
          title: r.title || "Untitled",
          url: r.url,
          creator: r.creator || "Unknown",
          license: r.license,
        })),
      },
    };
  } catch (e: any) {
    return { tool: "openverse_image", success: false, error: e.message };
  }
}

export async function executeTool(call: ToolCall): Promise<ToolResult> {
  switch (call.tool) {
    case "google_search": return executeGoogleSearch(call);
    case "openverse_image": return executeOpenverse(call);
  }
}

export const TOOLS_DESCRIPTION = `You have access to these tools:

1. google_search - Search the web for current news and information
   <tool_use>{"tool": "google_search", "query": "search terms", "num": 5}</tool_use>

2. openverse_image - Find Creative Commons licensed images for the blog
   <tool_use>{"tool": "openverse_image", "query": "image search terms"}</tool_use>

IMPORTANT: You MUST call BOTH tools:
- Use google_search to research the topic
- Use openverse_image to find a featured image

Output both tool calls together like this:
<tool_use>{"tool": "google_search", "query": "your search"}</tool_use>
<tool_use>{"tool": "openverse_image", "query": "relevant image search"}</tool_use>

After I give you the results, generate the final blog post as JSON.`;
