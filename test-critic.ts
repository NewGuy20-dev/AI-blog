import { critiqueArticle } from "./src/lib/ai/critic";
import { Article } from "./src/lib/schemas/article";

const mockArticle: Article = {
    title: "AI Breakthroughs in 2025",
    slug: "ai-breakthroughs-2025",
    summary: "Recent developments in artificial intelligence",
    content: [
        { type: "heading", level: 2, text: "Introduction" },
        { type: "paragraph", text: "AI has made significant progress. The future is now." },
        { type: "heading", level: 2, text: "Key Developments" },
        { type: "paragraph", text: "Many companies are investing in AI research." },
    ],
    sources: [
        { title: "AI News", url: "https://example.com/ai-news" },
    ],
    tags: ["AI", "Technology"],
};

const mockSearchResults = [
    {
        title: "OpenAI Releases GPT-5",
        url: "https://example.com/gpt5",
        content: "OpenAI announced GPT-5 with improved reasoning capabilities.",
    },
    {
        title: "Google DeepMind Breakthrough",
        url: "https://example.com/deepmind",
        content: "Google DeepMind achieved new milestones in protein folding.",
    },
];

async function testCritic() {
    console.log("🧪 Testing Critic Model...\n");
    console.log("📝 Input Article:");
    console.log(JSON.stringify(mockArticle, null, 2));
    console.log("\n📚 Search Results:");
    console.log(JSON.stringify(mockSearchResults, null, 2));

    try {
        console.log("\n⏳ Running critique...\n");
        const result = await critiqueArticle(
            mockArticle,
            "AI Breakthroughs in 2025",
            mockSearchResults
        );

        console.log("✅ Critique Complete!\n");
        console.log("Decision:", result.decision);
        console.log("Issues Found:", result.issues.length);
        console.log("High Severity:", result.high_severity_issues.length);
        console.log("Fixable:", result.fixable_issues.length);
        console.log("Confidence Score:", result.confidence_score);
        console.log("\n📋 Issues:");
        result.issues.forEach(i => console.log(`  - [${i.severity}] ${i.category}/${i.subcategory}: ${i.description}`));
        console.log("\n📄 Final Article:");
        console.log(JSON.stringify(result.final_article, null, 2));
    } catch (error) {
        console.error("❌ Critic Test Failed:", error);
        process.exit(1);
    }
}

testCritic();
