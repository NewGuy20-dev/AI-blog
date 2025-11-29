import { NextResponse } from "next/server";
import { runPipeline } from "@/lib/ai/pipeline";

export const maxDuration = 60; // Vercel timeout

export async function POST(req: Request) {
    try {
        const authHeader = req.headers.get("authorization");
        if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { topic } = await req.json().catch(() => ({}));
        const result = await runPipeline(topic);

        return NextResponse.json(result);
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
