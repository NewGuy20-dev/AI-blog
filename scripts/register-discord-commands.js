// Run with: DISCORD_BOT_TOKEN=xxx DISCORD_APP_ID=xxx node scripts/register-discord-commands.js
const token = process.env.DISCORD_BOT_TOKEN;
const appId = process.env.DISCORD_APP_ID;

const commands = [{
  name: "ask",
  description: "Ask Pageo bot about the app",
  options: [{
    name: "question",
    description: "Your question",
    type: 3,
    required: true
  }]
}];

fetch(`https://discord.com/api/v10/applications/${appId}/commands`, {
  method: "PUT",
  headers: { Authorization: `Bot ${token}`, "Content-Type": "application/json" },
  body: JSON.stringify(commands)
}).then(r => r.json()).then(console.log).catch(console.error);
