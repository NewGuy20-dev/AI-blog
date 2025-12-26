import { NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../convex/_generated/api";

const convex = new ConvexHttpClient(
  process.env.NEXT_PUBLIC_CONVEX_URL || "https://fantastic-alligator-727.convex.cloud"
);

function checkAuth(req: Request): boolean {
    const authHeader = req.headers.get("authorization");
    return authHeader === `Bearer ${process.env.CRON_SECRET}`;
}

export async function GET(req: Request) {
    if (!checkAuth(req)) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const result = await convex.mutation(api.posts.archiveOld, { maxAgeDays: 30 });
        return NextResponse.json({
            status: "ok",
            ...result,
            timestamp: new Date().toISOString(),
        });
    } catch (error: any) {
        return NextResponse.json({ status: "error", error: error.message }, { status: 500 });
    }
}
