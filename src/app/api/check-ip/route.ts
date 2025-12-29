import { NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Known datacenter/VPN IP ranges (partial list)
const DATACENTER_ASNS = new Set([
  "AS14061", // DigitalOcean
  "AS16276", // OVH
  "AS24940", // Hetzner
  "AS63949", // Linode
  "AS20473", // Vultr
  "AS14618", // Amazon AWS
  "AS15169", // Google
  "AS8075",  // Microsoft
]);

export async function GET(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || request.headers.get("x-real-ip")
    || "unknown";

  let isVpn = false;
  let blocked = false;
  let reason: string | undefined;
  let riskScore = 0;

  // Check if IP is blocked in database
  try {
    const result = await convex.query(api.blockedIps.isBlocked, { ip });
    blocked = result.blocked;
    reason = result.reason;
  } catch {}

  if (blocked) {
    return NextResponse.json({ blocked, reason, ip, isVpn: false, riskScore: 10 });
  }

  // Check 1: ip-api.com (proxy + hosting detection)
  try {
    const res = await fetch(
      `http://ip-api.com/json/${ip}?fields=status,proxy,hosting,isp,org,as`,
      { next: { revalidate: 3600 } }
    );
    if (res.ok) {
      const data = await res.json();
      if (data.status === "success") {
        if (data.proxy) { isVpn = true; riskScore += 5; }
        if (data.hosting) { isVpn = true; riskScore += 3; }
        
        // Check ASN against known datacenters
        if (data.as && DATACENTER_ASNS.has(data.as.split(" ")[0])) {
          isVpn = true;
          riskScore += 4;
        }
        
        // Check ISP/Org for VPN keywords
        const orgLower = (data.isp + " " + data.org).toLowerCase();
        const vpnKeywords = ["vpn", "proxy", "hosting", "cloud", "server", "datacenter", "vps"];
        if (vpnKeywords.some(k => orgLower.includes(k))) {
          riskScore += 2;
        }
      }
    }
  } catch {}

  // Check 2: ipinfo.io privacy detection (if available)
  if (process.env.IPINFO_TOKEN) {
    try {
      const res = await fetch(`https://ipinfo.io/${ip}?token=${process.env.IPINFO_TOKEN}`);
      if (res.ok) {
        const data = await res.json();
        if (data.privacy) {
          if (data.privacy.vpn) { isVpn = true; riskScore += 5; }
          if (data.privacy.proxy) { isVpn = true; riskScore += 5; }
          if (data.privacy.tor) { isVpn = true; riskScore += 10; }
          if (data.privacy.hosting) { riskScore += 3; }
        }
      }
    } catch {}
  }

  return NextResponse.json({ 
    blocked, 
    reason, 
    ip, 
    isVpn, 
    riskScore,
    shouldBlock: riskScore >= 5 
  });
}
