import { generateBlogWithTools } from "../src/lib/ai/gemma/generator";
import { critiqueWithGemma } from "../src/lib/ai/gemma/critic";
import { Article } from "../src/lib/schemas/article";

async function testFullPipeline() {
  console.log("═══════════════════════════════════════════════════════════");
  console.log("  RIGOROUS TEST: Full Gemma Pipeline with Tools");
  console.log("═══════════════════════════════════════════════════════════\n");

  // Test 1: Blog Generation
  console.log("TEST 1: Blog Generation with Tavily Search");
  console.log("─────────────────────────────────────────────────────────────");
  
  const topic = "Latest breakthroughs in quantum computing December 2024";
  console.log(`Topic: "${topic}"\n`);

  let generatedArticle: Article | null = null;

  try {
    const startGen = Date.now();
    const result = await generateBlogWithTools(topic);
    const genTime = Date.now() - startGen;
    generatedArticle = result.article;

    console.log("✅ Generation SUCCESS");
    console.log(`   Time: ${genTime}ms`);
    console.log(`   Turns: ${result.metrics.turns}`);
    console.log(`   Tools used: ${result.metrics.toolCalls.join(", ") || "none"}`);
    console.log(`\n   Article:`);
    console.log(`   - Title: ${result.article.title}`);
    console.log(`   - Slug: ${result.article.slug}`);
    console.log(`   - Summary: ${result.article.summary?.substring(0, 80)}...`);
    console.log(`   - Content blocks: ${result.article.content.length}`);
    console.log(`   - Sources: ${result.article.sources.length}`);
    console.log(`   - Tags: ${result.article.tags.join(", ")}`);
  } catch (e: any) {
    console.log("❌ Generation FAILED:", e.message);
  }

  // Test 2: Critique the generated article
  if (generatedArticle) {
    console.log("\n\nTEST 2: Critique Generated Article");
    console.log("─────────────────────────────────────────────────────────────");

    try {
      const startCrit = Date.now();
      const critique = await critiqueWithGemma(generatedArticle, topic);
      const critTime = Date.now() - startCrit;

      console.log("✅ Critique SUCCESS");
      console.log(`   Time: ${critTime}ms`);
      console.log(`   Tools used: ${critique.toolsUsed.join(", ") || "none"}`);
      console.log(`   Decision: ${critique.decision}`);
      console.log(`   Confidence: ${critique.confidence_score}`);
      console.log(`   Issues: ${critique.issues.length}`);
      
      if (critique.issues.length > 0) {
        console.log("\n   Issues found:");
        critique.issues.forEach(i => {
          console.log(`   - [${i.severity}] ${i.category}/${i.subcategory}`);
          console.log(`     ${i.description}`);
        });
      }
    } catch (e: any) {
      console.log("❌ Critique FAILED:", e.message);
    }
  }

  // Test 3: Critique a bad article
  console.log("\n\nTEST 3: Critique Intentionally Bad Article");
  console.log("─────────────────────────────────────────────────────────────");

  const badArticle: Article = {
    title: "SHOCKING: Elon Musk Confirms Aliens Built Tesla Factory!!!",
    slug: "elon-musk-aliens-tesla",
    summary: "Elon Musk has confirmed that aliens helped build the Tesla Gigafactory.",
    content: [
      { type: "heading", level: 1, text: "ALIENS ARE REAL" },
      { type: "paragraph", text: "In an exclusive interview, Elon Musk confirmed that extraterrestrial beings helped construct the Tesla Gigafactory in Nevada. The aliens reportedly provided advanced technology worth $999 trillion." },
      { type: "paragraph", text: "Buy Tesla stock NOW before it goes to $50,000 per share! This is guaranteed to make you rich!" },
    ],
    sources: [{ title: "Fake News Site", url: "https://totally-fake-news-12345.com/aliens" }],
    tags: ["aliens", "tesla", "conspiracy"],
    readingTime: 2,
  };

  console.log(`Article: "${badArticle.title}"`);
  console.log("(Should detect: fake claims, clickbait, financial advice, bad source)\n");

  try {
    const startBad = Date.now();
    const badCritique = await critiqueWithGemma(badArticle, "Tesla news");
    const badTime = Date.now() - startBad;

    console.log("✅ Critique SUCCESS");
    console.log(`   Time: ${badTime}ms`);
    console.log(`   Tools used: ${badCritique.toolsUsed.join(", ") || "none"}`);
    console.log(`   Decision: ${badCritique.decision}`);
    console.log(`   Confidence: ${badCritique.confidence_score}`);
    console.log(`   Total issues: ${badCritique.issues.length}`);
    console.log(`   High severity: ${badCritique.high_severity_issues.length}`);
    
    console.log("\n   Issues found:");
    badCritique.issues.forEach(i => {
      console.log(`   - [${i.severity.toUpperCase()}] ${i.category}/${i.subcategory}`);
      console.log(`     ${i.description.substring(0, 100)}${i.description.length > 100 ? '...' : ''}`);
    });

    if (badCritique.decision === "reject") {
      console.log("\n   ✅ Correctly REJECTED bad article!");
    } else {
      console.log("\n   ⚠️ WARNING: Bad article was NOT rejected!");
    }
  } catch (e: any) {
    console.log("❌ Critique FAILED:", e.message);
  }

  console.log("\n═══════════════════════════════════════════════════════════");
  console.log("  TEST COMPLETE");
  console.log("═══════════════════════════════════════════════════════════");
}

testFullPipeline();
