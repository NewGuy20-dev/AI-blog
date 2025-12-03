const PROD_URL = process.env.PROD_URL || "http://localhost:3000";
const CRON_SECRET = process.env.CRON_SECRET;

async function main() {
  if (!CRON_SECRET) {
    console.error("Error: CRON_SECRET environment variable is required");
    process.exit(1);
  }

  console.log(`Testing cron job at ${PROD_URL}/api/run-job...`);

  try {
    const response = await fetch(`${PROD_URL}/api/run-job`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${CRON_SECRET}`,
        "Content-Type": "application/json",
      },
      body: "{}",
    });

    const data = await response.json();

    if (!response.ok) {
      console.error(`Failed with status ${response.status}:`, data);
      process.exit(1);
    }

    console.log("✅ Success!");
    console.log("Topic:", data.topic);
    console.log("Status:", data.status);
    console.log("Timestamp:", data.timestamp);
    console.log("Run ID:", data.runId);
  } catch (error: any) {
    console.error("Error:", error.message);
    process.exit(1);
  }
}

main();
