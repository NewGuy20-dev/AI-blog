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

  try {
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
  } catch {
    return null;
  }
}

async function fetchOpenverseImage(
  query: string,
  token: string | null
): Promise<FeaturedImage | null> {
  try {
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;

    const params = new URLSearchParams({
      q: query,
      license: "cc0,pdm,by,by-sa",
      page_size: "5",
      mature: "false",
    });

    const res = await fetch(`${OPENVERSE_API}/images/?${params}`, { headers });
    
    // Handle rate limiting
    if (res.status === 429) {
      console.warn("Openverse rate limited");
      return null;
    }
    
    if (!res.ok) return null;

    const data = await res.json();
    if (!data.results?.length) return null;

    // Pick the best image (prefer larger images)
    const img = data.results.find((r: { width?: number }) => r.width && r.width >= 800) || data.results[0];
    
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

// Category-based fallback images (using Unsplash Source - free to use)
const CATEGORY_FALLBACKS: Record<string, string> = {
  technology: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&q=80",
  business: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80",
  sports: "https://images.unsplash.com/photo-1461896836934- voices-of-the-game?w=800&q=80",
  entertainment: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&q=80",
  health: "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=800&q=80",
  science: "https://images.unsplash.com/photo-1507413245164-6160d8298b31?w=800&q=80",
  politics: "https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=800&q=80",
  world: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&q=80",
  lifestyle: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&q=80",
  opinion: "https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=800&q=80",
  law: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&q=80",
  education: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&q=80",
  default: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&q=80",
};

function getFallbackImage(category?: string): FeaturedImage {
  const cat = category?.toLowerCase() || "default";
  const url = CATEGORY_FALLBACKS[cat] || CATEGORY_FALLBACKS.default;
  
  return {
    url,
    alt: `${category || "News"} article image`,
    attribution: {
      license: "Unsplash",
      source: "Unsplash",
      sourceUrl: "https://unsplash.com",
    },
  };
}

export async function searchImage(
  query: string,
  category?: string,
  tags?: string[]
): Promise<FeaturedImage | null> {
  const token = await getAccessToken();

  // Try multiple search strategies
  const searchQueries = [
    query,
    tags?.length ? `${query} ${tags[0]}` : null,
    category ? `${category} news` : null,
  ].filter(Boolean) as string[];

  for (const q of searchQueries) {
    const result = await fetchOpenverseImage(q, token);
    if (result) return result;
  }

  // Return category fallback if all searches fail
  return getFallbackImage(category || tags?.[0]);
}

export { getFallbackImage };
