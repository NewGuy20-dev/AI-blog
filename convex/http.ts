import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";

const http = httpRouter();

http.route({
  path: "/api/blocked-ip",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    const ip = url.searchParams.get("ip");

    if (!ip) {
      return new Response(JSON.stringify({ blocked: false }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    const result = await ctx.runQuery(api.blockedIps.isBlocked, { ip });

    return new Response(JSON.stringify(result), {
      headers: { 
        "Content-Type": "application/json",
        "Cache-Control": "max-age=60",
      },
    });
  }),
});

export default http;
