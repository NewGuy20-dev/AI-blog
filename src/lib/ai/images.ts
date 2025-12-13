import { FeaturedImage } from "../schemas/image";

const OPENVERSE_API = "https://api.openverse.org/v1";
let cachedToken: { token: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string | null> {
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.token;
  }

  const clientId = process.env.OPENVERSE_CLIENT_ID;
  const clientSecret = process.env.OPENVERSE_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;

  const res = await fetch(`${OPENVERSE_API}/auth_tokens/token/`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });

  if (!res.ok) return null;
  const data = await res.json();
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 60) * 1000,
  };
  return cachedToken.token;
}

export async function searchImage(query: string): Promise<FeaturedImage | null> {
  try {
    const token = await getAccessToken();
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;

    const params = new URLSearchParams({
      q: query,
      license: "cc0,pdm,by,by-sa",
      page_size: "1",
      mature: "false",
    });

    const res = await fetch(`${OPENVERSE_API}/images/?${params}`, { headers });
    if (!res.ok) return null;

    const data = await res.json();
    if (!data.results?.length) return null;

    const img = data.results[0];
    return {
      url: img.url,
      alt: img.title || query,
      attribution: {
        creator: img.creator || undefined,
        creatorUrl: img.creator_url || undefined,
        license: img.license?.toUpperCase() || "CC",
        licenseUrl: img.license_url || undefined,
        source: img.source || "Openverse",
        sourceUrl: img.foreign_landing_url || img.url,
      },
    };
  } catch {
    return null;
  }
}
