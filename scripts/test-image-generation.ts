import { generateBlogWithTools } from "../src/lib/ai/gemma/generator";

async function test() {
  console.log("Testing Blog Generation WITH IMAGE tool...\n");
  
  const topic = "Latest AI robotics news December 2024";
  console.log(`Topic: "${topic}"\n`);

  try {
    const result = await generateBlogWithTools(topic);
    
    console.log("✅ Generation SUCCESS\n");
    console.log("Title:", result.article.title);
    console.log("Slug:", result.article.slug);
    console.log("Content blocks:", result.article.content.length);
    console.log("Sources:", result.article.sources.length);
    console.log("Tags:", result.article.tags.join(", "));
    
    // Check for featured image in article
    const article = result.article as any;
    if (article.featuredImage) {
      console.log("\n✅ Featured Image:");
      console.log("   URL:", article.featuredImage.url);
      console.log("   Alt:", article.featuredImage.alt);
      console.log("   Credit:", article.featuredImage.credit);
    } else {
      console.log("\n⚠️ No featuredImage in article JSON");
    }
    
    console.log("\nMetrics:");
    console.log("  Turns:", result.metrics.turns);
    console.log("  Tools used:", result.metrics.toolCalls.join(", ") || "none");
    
    // Show image tool results
    const imageResult = result.toolResults.find(r => r.tool === "openverse_image");
    if (imageResult?.success && imageResult.data) {
      const data = imageResult.data as any;
      console.log("\n  Openverse returned", data.images?.length || 0, "images");
    }
    
  } catch (e: any) {
    console.log("❌ Error:", e.message);
  }
}

test();
