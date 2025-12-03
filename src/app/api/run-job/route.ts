import { NextResponse } from "next/server";
import { runPipeline } from "@/lib/ai/pipeline";

export const maxDuration = 60;

export async function POST(req: Request) {
    console.log("Triggered at:", new Date().toISOString());
    
    try {
        const authHeader = req.headers.get("authorization");
        if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            console.error("Unauthorized request");
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { topic } = await req.json().catch(() => ({}));
        console.log("Running pipeline for topic:", topic);
        
        const result = await runPipeline(topic);
        console.log("Pipeline result:", result);

        return NextResponse.json(result);
    } catch (error: any) {
        console.error("Pipeline error:", error.message);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
