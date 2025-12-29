const PROD_URL = process.env.PROD_URL || "http://localhost:3000";
const CRON_SECRET = process.env.CRON_SECRET;

async function main() {
  if (!CRON_SECRET) {
    console.error("Error: CRON_SECRET environment variable is required");
    process.exit(1);
  }

  console.log(`Testing Gemma pipeline at ${PROD_URL}/api/generate-gemma...`);

  try {
    const response = await fetch(`${PROD_URL}/api/generate-gemma`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${CRON_SECRET}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ topic: "Latest AI and technology news" }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error(`Failed with status ${response.status}:`, data);
      process.exit(1);
    }

    console.log("✅ Success!");
    console.log("Title:", data.article?.title);
    console.log("Slug:", data.article?.slug);
    console.log("Metrics:", data.metrics);
    console.log("Quota:", data.quota);
  } catch (error: any) {
    console.error("Error:", error.message);
    process.exit(1);
  }
}

main();
