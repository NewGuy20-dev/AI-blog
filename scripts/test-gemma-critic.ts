import { critiqueWithGemma } from "../src/lib/ai/gemma/critic";
import { Article } from "../src/lib/schemas/article";

// Test 1: Suspicious claims article
const suspiciousArticle: Article = {
  title: "AI Revolution: OpenAI Releases GPT-5 with 100% Accuracy",
  slug: "ai-revolution-gpt5-100-accuracy",
  summary: "OpenAI has released GPT-5, claiming it achieves 100% accuracy on all benchmarks.",
  content: [
    { type: "heading", level: 1, text: "AI Revolution: OpenAI Releases GPT-5" },
    { type: "paragraph", text: "In a groundbreaking announcement, OpenAI has released GPT-5, which they claim achieves 100% accuracy on all known benchmarks." },
    { type: "paragraph", text: "According to sources, the model was trained on 10 trillion parameters and cost $50 billion to develop." },
  ],
  sources: [{ title: "OpenAI Blog", url: "https://openai.com/blog/gpt5" }],
  tags: ["AI", "OpenAI", "GPT-5"],
  readingTime: 3,
};

// Test 2: Clickbait/conspiracy article
const badArticle: Article = {
  title: "SHOCKING: Elon Musk Confirms Aliens Built Tesla Factory!!!",
  slug: "elon-musk-aliens-tesla",
  summary: "Elon Musk has confirmed that aliens helped build the Tesla Gigafactory.",
  content: [
    { type: "heading", level: 1, text: "ALIENS ARE REAL" },
    { type: "paragraph", text: "In an exclusive interview, Elon Musk confirmed that extraterrestrial beings helped construct the Tesla Gigafactory. The aliens provided technology worth $999 trillion." },
    { type: "paragraph", text: "Buy Tesla stock NOW before it goes to $50,000! This is GUARANTEED to make you rich!" },
  ],
  sources: [{ title: "Fake News", url: "https://fake-news-12345.com/aliens" }],
  tags: ["aliens", "tesla"],
  readingTime: 2,
};

async function runTests() {
  console.log("═══════════════════════════════════════════════════════════");
  console.log("  GEMMA CRITIC TESTS");
  console.log("═══════════════════════════════════════════════════════════\n");

  // Test 1
  console.log("TEST 1: Suspicious Claims Article");
  console.log("─────────────────────────────────────────────────────────────");
  console.log(`Title: "${suspiciousArticle.title}"\n`);

  try {
    const result1 = await critiqueWithGemma(suspiciousArticle, "AI news");
    console.log("✅ Decision:", result1.decision);
    console.log("   Confidence:", result1.confidence_score);
    console.log("   Tools used:", result1.toolsUsed.join(", ") || "none");
    console.log("   Issues:", result1.issues.length, `(${result1.high_severity_issues.length} high)`);
    result1.issues.forEach(i => console.log(`   - [${i.severity}] ${i.category}/${i.subcategory}`));
  } catch (e: any) {
    console.log("❌ Error:", e.message);
  }

  // Test 2
  console.log("\n\nTEST 2: Clickbait/Conspiracy Article");
  console.log("─────────────────────────────────────────────────────────────");
  console.log(`Title: "${badArticle.title}"\n`);

  try {
    const result2 = await critiqueWithGemma(badArticle, "Tesla news");
    console.log("✅ Decision:", result2.decision);
    console.log("   Confidence:", result2.confidence_score);
    console.log("   Tools used:", result2.toolsUsed.join(", ") || "none");
    console.log("   Issues:", result2.issues.length, `(${result2.high_severity_issues.length} high)`);
    result2.issues.forEach(i => console.log(`   - [${i.severity}] ${i.category}/${i.subcategory}`));
    
    if (result2.decision === "reject") {
      console.log("\n   ✅ Correctly REJECTED!");
    }
  } catch (e: any) {
    console.log("❌ Error:", e.message);
  }

  console.log("\n═══════════════════════════════════════════════════════════");
}

runTests();
