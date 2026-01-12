import { auth0 } from "./lib/auth0";

let lockdownCache: { active: boolean; expires: number } | null = null;
const CACHE_TTL = 10000; // 10 seconds

async function checkLockdown(url: URL): Promise<Response | null> {
  // Skip lockdown check for API routes
  if (url.pathname.startsWith('/api/')) {
    return null;
  }

  // Check cache
  if (lockdownCache && lockdownCache.expires > Date.now()) {
    if (lockdownCache.active) {
      return new Response(
        '<html><body style="display:flex;align-items:center;justify-content:center;height:100vh;margin:0;font-family:system-ui"><div style="text-align:center"><h1>🔒 Emergency Lockdown</h1><p>System is temporarily unavailable</p></div></body></html>',
        { status: 503, headers: { 'Content-Type': 'text/html' } }
      );
    }
    return null;
  }

  // Check lockdown status
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_CONVEX_URL}/api/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        path: 'security:getEmergencyLockdown',
        args: {}
      })
    });

    const result = await response.json();
    const lockdown = result.value;
    
    lockdownCache = {
      active: lockdown?.active || false,
      expires: Date.now() + CACHE_TTL
    };

    if (lockdown?.active) {
      return new Response(
        '<html><body style="display:flex;align-items:center;justify-content:center;height:100vh;margin:0;font-family:system-ui"><div style="text-align:center"><h1>🔒 Emergency Lockdown</h1><p>System is temporarily unavailable</p></div></body></html>',
        { status: 503, headers: { 'Content-Type': 'text/html' } }
      );
    }
  } catch {
    // Fail open on error
  }

  return null;
}

export async function proxy(request: Request) {
  const url = new URL(request.url);
  
  const lockdownResponse = await checkLockdown(url);
  if (lockdownResponse) return lockdownResponse;

  return await auth0.middleware(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|icons|logo|manifest.json|sw.js).*)",
  ],
};
