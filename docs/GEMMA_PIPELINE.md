# Gemma 3-12B Blog Generation with Prompt-Based Function Calling

## Overview

This system uses Gemma 3-12B via the Gemini API with **prompt-based function calling** to generate SEO-optimized blog posts. Since Gemma doesn't support native function calling, we implement it through prompt engineering using `<tool_use>` tags.

## Architecture

```
┌─────────────────┐
│  User Request   │
│  (topic)        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Gemma 3-12B    │◄── System prompt + tool descriptions
│  (Turn 1)       │
└────────┬────────┘
         │
         ▼ Outputs: <tool_use>{"tool": "tavily_search", ...}</tool_use>
┌─────────────────┐
│  Parser         │──► Validates JSON with Zod
│  (Extract tags) │
└────────┬────────┘
         │
         ▼ Execute tools
┌─────────────────┐
│  Tavily API     │  ┌─────────────────┐
│  (Web Search)   │  │  Openverse API  │
└────────┬────────┘  │  (Images)       │
         │           └────────┬────────┘
         └──────┬─────────────┘
                │
                ▼ Tool results
┌─────────────────┐
│  Gemma 3-12B    │◄── Results in <tool_result> tags
│  (Turn 2)       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Blog Article   │
│  (JSON output)  │
└─────────────────┘
```

## Available Tools

### 1. tavily_search
Search the web for current news and information.

```json
<tool_use>
{"tool": "tavily_search", "query": "AI news December 2024", "max_results": 5}
</tool_use>
```

### 2. openverse_image
Find Creative Commons licensed images.

```json
<tool_use>
{"tool": "openverse_image", "query": "artificial intelligence"}
</tool_use>
```

## File Structure

```
src/lib/ai/gemma/
├── client.ts      # Gemini API client for Gemma
├── tools.ts       # Tool definitions, schemas, executors
├── parser.ts      # <tool_use> tag parser
├── generator.ts   # Main generation loop
├── monitoring.ts  # Quota tracking
└── index.ts       # Exports

src/app/api/generate-gemma/
└── route.ts       # API endpoint
```

## How It Works

1. **Initial Request**: User topic + tool descriptions sent to Gemma
2. **Tool Detection**: Parser extracts `<tool_use>` tags from response
3. **Validation**: Zod schemas validate the JSON tool calls
4. **Execution**: Tools (Tavily, Openverse) are executed
5. **Results**: Tool results sent back in `<tool_result>` tags
6. **Generation**: Gemma produces final blog JSON
7. **Loop**: Repeats up to 3 turns if more tools needed

## Environment Variables

```env
GOOGLE_GENERATIVE_AI_API_KEY=  # Gemini API key
TAVILY_API_KEY=                # Tavily search
OPENVERSE_CLIENT_ID=           # Openverse images
OPENVERSE_CLIENT_SECRET=       # Openverse images
CRON_SECRET=                   # API auth
```

## API Usage

### POST /api/generate-gemma

```bash
curl -X POST https://your-app.com/api/generate-gemma \
  -H "Authorization: Bearer $CRON_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"topic": "Latest AI news"}'
```

**Response:**
```json
{
  "status": "ok",
  "article": {
    "title": "...",
    "slug": "...",
    "summary": "...",
    "content": [...],
    "sources": [...],
    "tags": [...]
  },
  "metrics": {
    "totalLatencyMs": 5000,
    "turns": 2,
    "toolCalls": ["tavily_search"]
  },
  "toolResults": [{"tool": "tavily_search", "success": true}]
}
```

## Testing

```bash
# Set env vars from .env.local
export $(cat .env.local | xargs)

# Run test script
npx tsx scripts/test-gemma-tools.ts
```

## Rate Limits

- **Gemini API (Gemma)**: ~14,400 requests/day
- **Tavily**: Per your plan
- **Openverse**: 100 requests/day (authenticated)

## Key Differences from Native Function Calling

| Aspect | Native (Gemini) | Prompt-Based (Gemma) |
|--------|-----------------|----------------------|
| Tool declaration | API parameter | In prompt text |
| Tool invocation | `functionCalls` array | `<tool_use>` tags |
| Validation | API-level | Zod schemas |
| Reliability | High | Depends on prompt |
