import { NextResponse } from "next/server";
import { runGemmaPipeline } from "@/lib/ai/gemma/pipeline";
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
    const result = await runGemmaPipeline();
    return NextResponse.json({
      status: result.success ? "ok" : "error",
      source: "gemma+google_search+openverse",
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
    const result = await runGemmaPipeline();
    return NextResponse.json({
      status: result.success ? "ok" : "error",
      source: "gemma+google_search+openverse",
      timestamp: new Date().toISOString(),
      ...result,
    });
  } catch (error: any) {
    return NextResponse.json({ status: "error", error: error.message, timestamp: new Date().toISOString() }, { status: 500 });
  }
}
