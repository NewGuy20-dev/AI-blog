import { NextResponse } from "next/server";
import { generateBlogWithTools } from "@/lib/ai/gemma/generator";
import { trackApiCall, logGeneration, getQuotaStatus } from "@/lib/ai/gemma/monitoring";

export const maxDuration = 60;

function checkAuth(req: Request): boolean {
  const authHeader = req.headers.get("authorization");
  return authHeader === `Bearer ${process.env.CRON_SECRET}`;
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
    const { topic } = await req.json();
    if (!topic) {
      return NextResponse.json({ error: "Topic required" }, { status: 400 });
    }

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
