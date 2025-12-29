export interface TavilySearchResult {
  title: string;
  url: string;
  content: string;
  score: number;
}

export interface TavilyResponse {
  answer?: string;
  results: TavilySearchResult[];
}

export interface WebSearchArgs {
  query: string;
  search_depth?: "basic" | "advanced";
  max_results?: number;
}

export async function executeTavilySearch(args: WebSearchArgs): Promise<TavilyResponse> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) throw new Error("TAVILY_API_KEY is not set");

  const response = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: apiKey,
      query: args.query,
      search_depth: args.search_depth || "advanced",
      max_results: Math.min(args.max_results || 5, 10),
      include_answer: true,
      include_raw_content: false,
      topic: "news",
      days: 3,
    }),
  });

  if (!response.ok) {
    throw new Error(`Tavily API error: ${response.statusText}`);
  }

  const data = await response.json();

  return {
    answer: data.answer,
    results: data.results.map((r: any) => ({
      title: r.title,
      url: r.url,
      content: r.content,
      score: r.score || 0,
    })),
  };
}
