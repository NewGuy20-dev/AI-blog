import { NextResponse } from "next/server";
import { runPipeline } from "@/lib/ai/pipeline";
import { timingSafeEqual } from "crypto";

export const maxDuration = 60;

function checkAuth(req: Request): boolean {
  const authHeader = req.headers.get("authorization");
  const expected = `Bearer ${process.env.CRON_SECRET}`;
  if (!authHeader || authHeader.length !== expected.length) return false;
  try {
    return timingSafeEqual(Buffer.from(authHeader), Buffer.from(expected));
  } catch {
    return false;
  }
}

export async function GET(req: Request) {
  if (!checkAuth(req)) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const result = await runPipeline();
    return NextResponse.json({
      status: "ok",
      source: "gemini+tavily",
      timestamp: new Date().toISOString(),
      ...result,
    });
  } catch (error: any) {
    return NextResponse.json({ status: "error", error: error.message, timestamp: new Date().toISOString() }, { status: 500 });
  }
}

export async function POST(req: Request) {
  if (!checkAuth(req)) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  await req.json().catch(() => ({}));

  try {
    const result = await runPipeline();
    return NextResponse.json({
      status: "ok",
      source: "gemini+tavily",
      timestamp: new Date().toISOString(),
      ...result,
    });
  } catch (error: any) {
    return NextResponse.json({ status: "error", error: error.message, timestamp: new Date().toISOString() }, { status: 500 });
  }
}
