import { generateText } from "ai";
import { model } from "./config";

export interface SearchResult {
    title: string;
    url: string;
    content: string;
    publishedDate?: string;
}

export async function discoverTopic(): Promise<string> {
    const results = await searchNews("top artificial intelligence news today");
    
    const articles = results.map(r => 
        `Title: ${r.title}\nURL: ${r.url}\nContent: ${r.content}`
    ).join("\n\n---\n\n");
    
    const { text } = await generateText({
        model,
        prompt: `Analyze these AI news articles and identify the single most significant, newsworthy topic that would make a compelling blog post.

Articles:
${articles}

Based on your analysis of the article content, return ONLY a specific topic phrase (5-15 words) that captures the most important story. Nothing else.`,
    });
    
    return text.trim();
}

export async function searchNews(topic: string): Promise<SearchResult[]> {
    const apiKey = process.env.TAVILY_API_KEY;
    if (!apiKey) {
        throw new Error("TAVILY_API_KEY is not set");
    }

    const response = await fetch("https://api.tavily.com/search", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            api_key: apiKey,
            query: topic,
            search_depth: "basic",
            include_answer: false,
            include_images: false,
            include_raw_content: false,
            max_results: 5,
            topic: "news", // Tavily specific for news
            days: 1, // Last 24 hours
        }),
    });

    if (!response.ok) {
        throw new Error(`Tavily API error: ${response.statusText}`);
    }

    const data = await response.json();

    return data.results.map((result: any) => ({
        title: result.title,
        url: result.url,
        content: result.content,
        publishedDate: result.published_date,
    }));
}
