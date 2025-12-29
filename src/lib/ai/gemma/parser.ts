import { ToolCallSchema, ToolCall } from "./tools";

export interface ParsedResponse {
  text: string;
  toolCalls: ToolCall[];
  hasToolCalls: boolean;
}

export function parseToolCalls(response: string): ParsedResponse {
  const toolCalls: ToolCall[] = [];
  const regex = /<tool_use>([\s\S]*?)<\/tool_use>/g;
  let match;

  while ((match = regex.exec(response)) !== null) {
    try {
      const json = JSON.parse(match[1].trim());
      const parsed = ToolCallSchema.safeParse(json);
      if (parsed.success) {
        toolCalls.push(parsed.data);
      }
    } catch {
      // Invalid JSON, skip
    }
  }

  // Remove tool_use tags from text
  const text = response.replace(/<tool_use>[\s\S]*?<\/tool_use>/g, "").trim();

  return { text, toolCalls, hasToolCalls: toolCalls.length > 0 };
}

export function formatToolResults(results: { tool: string; success: boolean; data?: any; error?: string }[]): string {
  return results.map(r => 
    `<tool_result tool="${r.tool}">\n${r.success ? JSON.stringify(r.data, null, 2) : `Error: ${r.error}`}\n</tool_result>`
  ).join("\n\n");
}
