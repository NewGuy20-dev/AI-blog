import { GoogleGenAI } from "@google/genai";
import { parseToolCalls, formatToolResults } from "../src/lib/ai/gemma/parser";
import { executeTool, TOOLS_DESCRIPTION } from "../src/lib/ai/gemma/tools";

const client = new GoogleGenAI({ apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY });
const MODEL = "gemma-3-12b-it";

const SYSTEM = `You are a blog writer. ${TOOLS_DESCRIPTION}

First search for info, then write the blog as JSON.`;

async function test() {
  console.log("Testing Gemma with prompt-based tools...\n");
  
  const systemPrompt = `You are a blog writer. ${TOOLS_DESCRIPTION}

First search for info, then write the blog as JSON.`;
  
  const messages: any[] = [{ role: "user", parts: [{ text: `${systemPrompt}\n\nWrite a blog about latest AI news` }] }];
  
  console.log("Turn 1: Asking Gemma...");
  const r1 = await client.models.generateContent({
    model: MODEL,
    contents: messages,
  });
  
  const text1 = r1.text || "";
  console.log("Response preview:", text1.substring(0, 500));
  
  const parsed = parseToolCalls(text1);
  console.log("\nTool calls found:", parsed.toolCalls.length);
  
  if (parsed.hasToolCalls) {
    console.log("Tools:", parsed.toolCalls.map(c => c.tool));
    
    const results = await Promise.all(parsed.toolCalls.map(executeTool));
    console.log("Results:", results.map(r => `${r.tool}: ${r.success}`));
    
    messages.push({ role: "model", parts: [{ text: text1 }] });
    messages.push({ role: "user", parts: [{ text: `Results:\n${formatToolResults(results)}\n\nNow write the blog as JSON.` }] });
    
    console.log("\nTurn 2: Getting final blog...");
    const r2 = await client.models.generateContent({
      model: MODEL,
      contents: messages,
    });
    
    console.log("Final response preview:", (r2.text || "").substring(0, 800));
  } else {
    console.log("No tool calls - Gemma responded directly");
  }
}

test().catch(e => console.error("Error:", e.message));
