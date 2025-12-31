import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
const DISCORD_PUBLIC_KEY = process.env.DISCORD_PUBLIC_KEY!;
const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN!;

async function verifyDiscordSignature(req: NextRequest, body: string): Promise<boolean> {
  const signature = req.headers.get("x-signature-ed25519");
  const timestamp = req.headers.get("x-signature-timestamp");
  if (!signature || !timestamp || !DISCORD_PUBLIC_KEY) return false;
  
  try {
    const message = new TextEncoder().encode(timestamp + body);
    const sigBytes = new Uint8Array(signature.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
    const keyBytes = new Uint8Array(DISCORD_PUBLIC_KEY.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
    const cryptoKey = await crypto.subtle.importKey("raw", keyBytes, { name: "Ed25519" }, false, ["verify"]);
    return await crypto.subtle.verify("Ed25519", cryptoKey, sigBytes, message);
  } catch {
    return false;
  }
}

async function sendDM(userId: string, content: string) {
  const dmRes = await fetch("https://discord.com/api/v10/users/@me/channels", {
    method: "POST",
    headers: { Authorization: `Bot ${DISCORD_BOT_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ recipient_id: userId }),
  });
  const dm = await dmRes.json();
  await fetch(`https://discord.com/api/v10/channels/${dm.id}/messages`, {
    method: "POST",
    headers: { Authorization: `Bot ${DISCORD_BOT_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
  });
}

async function editOriginalResponse(appId: string, token: string, content: string) {
  await fetch(`https://discord.com/api/v10/webhooks/${appId}/${token}/messages/@original`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
  });
}

async function getAppContext(): Promise<string> {
  try {
    const [posts, securityEvents, blockedIps] = await Promise.all([
      convex.query(api.posts.getPublishedCount, {}),
      convex.query(api.security.getRecentEvents, { limit: 10 }),
      convex.query(api.security.getBlockedIPCount, {}),
    ]);
    return `APP: Pageo AI News Blog | Posts: ${posts.count} published | Blocked IPs: ${blockedIps.count} | Security Events: ${securityEvents.length} recent`;
  } catch {
    return "APP: Pageo AI News Blog";
  }
}

async function askGemma(userMessage: string, context: string): Promise<{ response: string; sensitive: boolean }> {
  const { GoogleGenAI } = await import("@google/genai");
  const genai = new GoogleGenAI({ apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY! });
  
  const result = await genai.models.generateContent({
    model: "gemma-3-12b-it",
    contents: [{ role: "user", parts: [{ text: `${context}\n\nQ: ${userMessage}\n\nAnswer briefly. End with [SENSITIVE] if contains IPs/userIDs, else [PUBLIC].` }] }],
  });
  
  const text = result.text || "Unable to process.";
  const sensitive = text.includes("[SENSITIVE]");
  return { response: text.replace(/\[(SENSITIVE|PUBLIC)\]/g, "").trim(), sensitive };
}

async function handleAction(action: string, args: string, key: string, userId: string): Promise<{ success: boolean; message: string; newKey?: string }> {
  const validation = await convex.mutation(api.bot.validateAndRotateKey, { key, usedBy: userId });
  if (!validation.valid) return { success: false, message: "❌ Invalid action key." };
  
  let result: string;
  switch (action) {
    case "archive":
      const archiveResult = await convex.mutation(api.admin.publishPost, { slug: args });
      result = archiveResult.success ? `✅ Archived: ${args}` : `❌ ${archiveResult.message}`;
      break;
    case "view-security":
      const events = await convex.query(api.security.getRecentEvents, { limit: 20 });
      result = `🔒 Security Events:\n${events.map((e: any) => `[${e.severity}] ${e.eventType}`).join("\n")}`;
      break;
    default:
      result = `❌ Unknown action: ${action}`;
  }
  return { success: true, message: result, newKey: validation.newKey! };
}

// Background processor - called via fetch to itself
async function processInBackground(userId: string, content: string, appId: string, token: string) {
  try {
    const rateLimit = await convex.query(api.bot.checkRateLimit, { discordUserId: userId });
    if (!rateLimit.allowed) {
      await editOriginalResponse(appId, token, "⏳ Rate limited.");
      return;
    }
    await convex.mutation(api.bot.recordRequest, { discordUserId: userId });

    const keyMatch = content.match(/key:([A-Za-z0-9]{32})/);
    if (keyMatch) {
      const key = keyMatch[1];
      const actionPart = content.replace(/key:[A-Za-z0-9]{32}/, "").trim();
      const [action, ...argParts] = actionPart.split(" ");
      const result = await handleAction(action, argParts.join(" "), key, userId);
      if (result.newKey) await sendDM(userId, `🔑 New key: \`${result.newKey}\``);
      await editOriginalResponse(appId, token, result.message);
      return;
    }

    const context = await getAppContext();
    const { response, sensitive } = await askGemma(content, context);
    
    if (sensitive) {
      await sendDM(userId, response);
      await editOriginalResponse(appId, token, "📬 Sent to DMs.");
    } else {
      await editOriginalResponse(appId, token, response);
    }
  } catch (e) {
    console.error("Process error:", e);
    await editOriginalResponse(appId, token, "❌ Error occurred.");
  }
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  
  if (!await verifyDiscordSignature(req, body)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }
  
  const interaction = JSON.parse(body);
  
  if (interaction.type === 1) return NextResponse.json({ type: 1 });
  
  if (interaction.type === 2) {
    const userId = interaction.member?.user?.id || interaction.user?.id;
    const content = interaction.data?.options?.[0]?.value || "";
    const token = interaction.token;
    const appId = interaction.application_id;
    
    // Start background processing (fire and forget)
    processInBackground(userId, content, appId, token).catch(console.error);
    
    // Return deferred response immediately (type 5)
    return NextResponse.json({ type: 5 });
  }
  
  return NextResponse.json({ type: 1 });
}

// Keep function alive for Vercel
export const maxDuration = 60;
