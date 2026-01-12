import { NextResponse } from "next/server";
import { generateBlogWithTools } from "@/lib/ai/gemma/generator";
import { trackApiCall, logGeneration, getQuotaStatus } from "@/lib/ai/gemma/monitoring";
import { timingSafeEqual } from "crypto";
import { z } from "zod";

export const maxDuration = 60;

// Zod schema for topic validation
const topicSchema = z.object({
  topic: z.string()
    .min(3, "Topic must be at least 3 characters")
    .max(200, "Topic must not exceed 200 characters")
    .regex(/^[a-zA-Z0-9\s\-.,!?'"]+$/, "Topic contains invalid characters")
    .refine(
      (val) => !/(script|javascript|eval|exec|system|cmd)/i.test(val),
      "Topic contains potentially malicious content"
    ),
});

function checkAuth(req: Request): boolean {
  const authHeader = req.headers.get("authorization");
  const expected = `Bearer ${process.env.CRON_SECRET}`;
  
  // Pad to fixed length to prevent timing attacks
  const paddedAuth = (authHeader || '').padEnd(200, '\0');
  const paddedExpected = expected.padEnd(200, '\0');
  
  try {
    return timingSafeEqual(
      Buffer.from(paddedAuth),
      Buffer.from(paddedExpected)
    );
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  if (!checkAuth(req)) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const quota = trackApiCall();
  if (!quota.allowed) {
    return NextResponse.json({ error: "Daily quota exceeded", quota: getQuotaStatus() }, { status: 429 });
  }

  try {
    const body = await req.json();
    
    // Validate input with Zod
    const validation = topicSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { 
          error: "Invalid topic", 
          details: validation.error.issues.map(e => e.message),
          quota: getQuotaStatus() 
        },
        { status: 400 }
      );
    }

    const { topic } = validation.data;

    const result = await generateBlogWithTools(topic);
    logGeneration(topic, result.metrics, true);

    return NextResponse.json({
      status: "ok",
      article: result.article,
      metrics: result.metrics,
      toolResults: result.toolResults.map(r => ({ tool: r.tool, success: r.success })),
      quota: getQuotaStatus(),
    });
  } catch (error: any) {
    logGeneration("unknown", { totalLatencyMs: 0, turns: 0, toolCalls: [] }, false);
    return NextResponse.json({ error: error.message, quota: getQuotaStatus() }, { status: 500 });
  }
}

export async function GET(req: Request) {
  if (!checkAuth(req)) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  return NextResponse.json({ status: "ok", quota: getQuotaStatus() });
}
