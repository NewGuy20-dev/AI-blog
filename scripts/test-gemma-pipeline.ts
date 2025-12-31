import { config } from "dotenv";
config({ path: ".env.local" });

import { executeGoogleSearch, executeOpenverse } from "../src/lib/ai/gemma/tools";
import { generateBlogWithTools } from "../src/lib/ai/gemma/generator";

async function testPipeline() {
  console.log("=== GEMMA PIPELINE TEST SUITE ===\n");

  // Test 1: Google Search
  console.log("1. Testing Google Search...");
  const searchResult = await executeGoogleSearch({
    tool: "google_search",
    query: "trending technology news today",
    num: 3,
  });
  if (searchResult.success) {
    console.log("   ✅ Google Search working");
    console.log(`   Found ${(searchResult as any).data.results.length} results`);
  } else {
    console.log("   ❌ Google Search failed:", (searchResult as any).error);
  }

  // Test 2: Openverse
  console.log("\n2. Testing Openverse...");
  const imageResult = await executeOpenverse({
    tool: "openverse_image",
    query: "technology news",
  });
  if (imageResult.success) {
    console.log("   ✅ Openverse working");
    console.log(`   Found ${(imageResult as any).data.images.length} images`);
  } else {
    console.log("   ❌ Openverse failed:", (imageResult as any).error);
  }

  // Test 3: Full Generation
  console.log("\n3. Testing Full Article Generation...");
  try {
    const result = await generateBlogWithTools("Latest AI technology news");
    console.log("   ✅ Article generated");
    console.log(`   Title: ${result.article.title}`);
    console.log(`   Slug: ${result.article.slug}`);
    console.log(`   Tags: ${result.article.tags.join(", ")}`);
    console.log(`   Content blocks: ${result.article.content.length}`);
    console.log(`   Has featured image: ${!!result.article.featuredImage}`);
    console.log(`   Metrics: ${result.metrics.turns} turns, ${result.metrics.totalLatencyMs}ms`);
    console.log(`   Tools used: ${result.metrics.toolCalls.join(", ")}`);
  } catch (e: any) {
    console.log("   ❌ Generation failed:", e.message);
  }

  console.log("\n=== TEST COMPLETE ===");
}

testPipeline().catch(console.error);
