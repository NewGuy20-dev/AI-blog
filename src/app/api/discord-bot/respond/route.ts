import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN!;

async function sendMessage(channelId: string, content: string) {
  await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
    method: "POST",
    headers: { Authorization: `Bot ${DISCORD_BOT_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
  });
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

export async function POST(req: NextRequest) {
  const { channelId, content, context, userId } = await req.json();
  
  try {
    const genai = new GoogleGenAI({ apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY! });
    
    const result = await genai.models.generateContent({
      model: "gemma-3-12b-it",
      contents: [{ role: "user", parts: [{ text: `${context}\n\nQ: ${content}\n\nAnswer briefly. End with [SENSITIVE] if contains IPs/userIDs, else [PUBLIC].` }] }],
    });
    
    const text = result.text || "Unable to process.";
    const sensitive = text.includes("[SENSITIVE]");
    const response = text.replace(/\[(SENSITIVE|PUBLIC)\]/g, "").trim();
    
    if (sensitive) {
      await sendDM(userId, `🤖 **AI Response:**\n${response}`);
      await sendMessage(channelId, "📬 Sensitive info sent to your DMs.");
    } else {
      await sendMessage(channelId, `🤖 **AI Response:**\n${response}`);
    }
  } catch (e) {
    console.error("Gemma error:", e);
    await sendMessage(channelId, "❌ AI processing failed.");
  }
  
  return NextResponse.json({ ok: true });
}

export const maxDuration = 60;
