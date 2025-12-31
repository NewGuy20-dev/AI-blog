import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
const DISCORD_PUBLIC_KEY = process.env.DISCORD_PUBLIC_KEY!;
const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN!;

// Verify Discord signature using Web Crypto API
async function verifyDiscordSignature(req: NextRequest, body: string): Promise<boolean> {
  const signature = req.headers.get("x-signature-ed25519");
  const timestamp = req.headers.get("x-signature-timestamp");
  
  if (!signature || !timestamp) return false;
  
  try {
    const publicKeyBytes = hexToBytes(DISCORD_PUBLIC_KEY);
    const key = await crypto.subtle.importKey(
      "raw",
      publicKeyBytes,
      { name: "Ed25519", namedCurve: "Ed25519" },
      false,
      ["verify"]
    );
    
    const signatureBytes = hexToBytes(signature);
    const messageBytes = new TextEncoder().encode(timestamp + body);
    
    return await crypto.subtle.verify("Ed25519", key, signatureBytes, messageBytes);
  } catch {
    return false;
  }
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

// Send DM to a user
async function sendDM(userId: string, content: string) {
  // Create DM channel
  const dmRes = await fetch("https://discord.com/api/v10/users/@me/channels", {
    method: "POST",
    headers: {
      Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ recipient_id: userId }),
  });
  const dm = await dmRes.json();
  
  // Send message
  await fetch(`https://discord.com/api/v10/channels/${dm.id}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ content }),
  });
}

// Get app context for Gemma
async function getAppContext(): Promise<string> {
  const [posts, users, securityEvents, auditLogs, blockedIps] = await Promise.all([
    convex.query(api.admin.getStats, {}),
    convex.query(api.admin.listUsers, { limit: 5 }),
    convex.query(api.security.getRecentEvents, { limit: 10 }),
    convex.query(api.admin.getAuditLogs, { limit: 5 }),
    convex.query(api.security.getBlockedIPCount, {}),
  ]);
  
  return `
APP CONTEXT (Pageo - AI News Blog):
- Posts: ${posts.posts.total} total (${posts.posts.published} published, ${posts.posts.draft} draft, ${posts.posts.archived} archived)
- Users: ${posts.users} registered
- Bookmarks: ${posts.bookmarks} total
- Admins: ${posts.admins}
- Blocked IPs: ${blockedIps.count}
- Recent Security Events: ${securityEvents.length} in last 24h
- Last Pipeline Run: ${auditLogs[0]?.stage || "unknown"} - ${auditLogs[0]?.status || "unknown"}

AVAILABLE ACTIONS (require key):
- archive <slug> - Archive a post
- view-security - View detailed security events (sensitive, sent via DM)

SENSITIVITY RULES:
- User IDs, IPs, security details = SENSITIVE (DM only)
- Stats, counts, general info = NON-SENSITIVE (channel OK)
`.trim();
}

// Call Gemma for response
async function askGemma(userMessage: string, context: string): Promise<{ response: string; sensitive: boolean }> {
  const { GoogleGenAI } = await import("@google/genai");
  const genai = new GoogleGenAI({ apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY! });
  
  const result = await genai.models.generateContent({
    model: "gemma-3-12b-it",
    contents: [{
      role: "user",
      parts: [{ text: `${context}\n\nUser question: ${userMessage}\n\nRespond concisely. End with [SENSITIVE] if response contains user IDs, IPs, or security details, otherwise end with [PUBLIC].` }],
    }],
  });
  
  const text = result.text || "I couldn't process that request.";
  const sensitive = text.includes("[SENSITIVE]");
  const response = text.replace(/\[(SENSITIVE|PUBLIC)\]/g, "").trim();
  
  return { response, sensitive };
}

// Handle admin actions
async function handleAction(action: string, args: string, key: string, userId: string): Promise<{ success: boolean; message: string; newKey?: string }> {
  const validation = await convex.mutation(api.bot.validateAndRotateKey, { key, usedBy: userId });
  
  if (!validation.valid) {
    return { success: false, message: "❌ Invalid action key." };
  }
  
  let result: string;
  
  switch (action) {
    case "archive": {
      const archiveResult = await convex.mutation(api.admin.publishPost, { slug: args }); // Using existing mutation
      result = archiveResult.success ? `✅ Archived: ${args}` : `❌ ${archiveResult.message}`;
      break;
    }
    case "view-security": {
      const events = await convex.query(api.security.getRecentEvents, { limit: 20 });
      const formatted = events.map((e: any) => `[${e.severity}] ${e.eventType} - ${e.ip || "N/A"}`).join("\n");
      result = `🔒 Security Events:\n${formatted}`;
      break;
    }
    default:
      result = `❌ Unknown action: ${action}`;
  }
  
  return { success: true, message: result, newKey: validation.newKey! };
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  
  // Verify signature
  const isValid = await verifyDiscordSignature(req, body);
  if (!isValid) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }
  
  const interaction = JSON.parse(body);
  
  // Handle PING (Discord verification)
  if (interaction.type === 1) {
    return NextResponse.json({ type: 1 });
  }
  
  // Handle MESSAGE_CREATE or APPLICATION_COMMAND
  if (interaction.type === 2 || interaction.type === 3) {
    const userId = interaction.member?.user?.id || interaction.user?.id;
    const content = interaction.data?.options?.[0]?.value || interaction.data?.name || "";
    
    // Check rate limit
    const rateLimit = await convex.query(api.bot.checkRateLimit, { discordUserId: userId });
    if (!rateLimit.allowed) {
      return NextResponse.json({
        type: 4,
        data: { content: `⏳ Rate limited. Try again in a minute. (${rateLimit.remaining}/10 remaining)` },
      });
    }
    
    // Record request
    await convex.mutation(api.bot.recordRequest, { discordUserId: userId });
    
    // Check for action with key
    const keyMatch = content.match(/key:([A-Za-z0-9]{32})/);
    if (keyMatch) {
      const key = keyMatch[1];
      const actionPart = content.replace(/key:[A-Za-z0-9]{32}/, "").trim();
      const [action, ...argParts] = actionPart.split(" ");
      const args = argParts.join(" ");
      
      const result = await handleAction(action, args, key, userId);
      
      if (result.newKey) {
        // DM new key to user
        await sendDM(userId, `🔑 New action key: \`${result.newKey}\`\nKeep this safe!`);
      }
      
      return NextResponse.json({
        type: 4,
        data: { content: result.message },
      });
    }
    
    // Regular chat - use Gemma
    const context = await getAppContext();
    const { response, sensitive } = await askGemma(content, context);
    
    if (sensitive) {
      await sendDM(userId, response);
      return NextResponse.json({
        type: 4,
        data: { content: "📬 Sensitive info sent to your DMs." },
      });
    }
    
    return NextResponse.json({
      type: 4,
      data: { content: response },
    });
  }
  
  return NextResponse.json({ type: 1 });
}
