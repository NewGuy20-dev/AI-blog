import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
const DISCORD_PUBLIC_KEY = process.env.DISCORD_PUBLIC_KEY!;
const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN!;

// Verify Discord signature
async function verifyDiscordSignature(req: NextRequest, body: string): Promise<boolean> {
  const signature = req.headers.get("x-signature-ed25519");
  const timestamp = req.headers.get("x-signature-timestamp");
  
  if (!signature || !timestamp || !DISCORD_PUBLIC_KEY) return false;
  
  try {
    const encoder = new TextEncoder();
    const message = encoder.encode(timestamp + body);
    
    // Convert hex strings to Uint8Array
    const sigBytes = new Uint8Array(signature.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
    const keyBytes = new Uint8Array(DISCORD_PUBLIC_KEY.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
    
    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      keyBytes,
      { name: "Ed25519" },
      false,
      ["verify"]
    );
    
    return await crypto.subtle.verify("Ed25519", cryptoKey, sigBytes, message);
  } catch (e) {
    console.error("Signature verification error:", e);
    return false;
  }
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

// Get app context for Gemma (using public queries)
async function getAppContext(): Promise<string> {
  try {
    const [posts, securityEvents, blockedIps] = await Promise.all([
      convex.query(api.posts.getPublishedCount, {}),
      convex.query(api.security.getRecentEvents, { limit: 10 }),
      convex.query(api.security.getBlockedIPCount, {}),
    ]);
    
    return `
APP CONTEXT (Pageo - AI News Blog):
- Published Posts: ${posts.count}
- Blocked IPs: ${blockedIps.count}
- Recent Security Events: ${securityEvents.length}

AVAILABLE ACTIONS (require key):
- archive <slug> - Archive a post
- view-security - View detailed security events (sensitive, sent via DM)

SENSITIVITY RULES:
- User IDs, IPs, security details = SENSITIVE (DM only)
- Stats, counts, general info = NON-SENSITIVE (channel OK)
`.trim();
  } catch (e) {
    console.error("Context error:", e);
    return "APP CONTEXT: Unable to fetch stats. Bot is operational.";
  }
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
