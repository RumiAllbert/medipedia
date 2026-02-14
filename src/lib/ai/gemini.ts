import { GoogleGenAI } from "@google/genai";
import { z } from "zod";

import { DEFAULT_GEMINI_MODEL } from "@/lib/ai/prompts";

export type GroundingChunk = {
  uri: string;
  title: string;
};

export type GroundingMetadata = {
  webSearchQueries?: string[];
  groundingChunks?: GroundingChunk[];
  groundingSupports?: Array<{
    segment: { startIndex?: number; endIndex?: number; text?: string };
    groundingChunkIndices: number[];
  }>;
};

export type GroundedJsonResult<T> = {
  data: T | null;
  groundingMetadata: GroundingMetadata | null;
  groundingChunks: GroundingChunk[];
  rawText: string | null;
  inputTokens: number | null;
  outputTokens: number | null;
};

export function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({ apiKey });
}

/**
 * Repairs truncated or slightly malformed JSON that LLMs commonly produce.
 */
function repairJson(text: string): string {
  let s = text.trim();
  s = s.replace(/^```json\s*/i, "").replace(/```\s*$/, "").trim();

  try {
    JSON.parse(s);
    return s;
  } catch {
    // continue to repair
  }

  // Close unclosed strings
  let inString = false;
  let escaped = false;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (escaped) { escaped = false; continue; }
    if (ch === "\\") { escaped = true; continue; }
    if (ch === '"') inString = !inString;
  }
  if (inString) s += '"';

  // Remove trailing commas before } or ]
  s = s.replace(/,\s*([}\]])/g, "$1");

  // Close unclosed brackets/braces
  const stack: string[] = [];
  inString = false;
  escaped = false;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (escaped) { escaped = false; continue; }
    if (ch === "\\") { escaped = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === "{" || ch === "[") stack.push(ch);
    if (ch === "}" && stack.length && stack[stack.length - 1] === "{") stack.pop();
    if (ch === "]" && stack.length && stack[stack.length - 1] === "[") stack.pop();
  }
  while (stack.length) {
    const open = stack.pop();
    s += open === "{" ? "}" : "]";
  }
  s = s.replace(/,\s*([}\]])/g, "$1");

  return s;
}

function parseJson(text: string): unknown {
  const repaired = repairJson(text);
  return JSON.parse(repaired);
}

export async function generateGroundedJson<T>(params: {
  prompt: string;
  schema: z.ZodType<T>;
  grounded?: boolean;
  maxOutputTokens?: number;
}): Promise<GroundedJsonResult<T>> {
  const client = getGeminiClient();
  if (!client) {
    console.error("[Gemini] No API key configured — GEMINI_API_KEY is missing");
    return {
      data: null,
      groundingMetadata: null,
      groundingChunks: [],
      rawText: null,
      inputTokens: null,
      outputTokens: null,
    };
  }

  const model = process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL;

  // Convert Zod schema to JSON Schema for Gemini's responseJsonSchema
  const jsonSchema = (params.schema as z.ZodObject<z.ZodRawShape>).toJSONSchema();

  let response;
  try {
    response = await client.models.generateContent({
      model,
      contents: params.prompt,
      config: {
        responseMimeType: "application/json",
        responseJsonSchema: jsonSchema,
        maxOutputTokens: params.maxOutputTokens ?? 4096,
        tools: params.grounded ? [{ googleSearch: {} }] : undefined,
      },
    });
  } catch (error) {
    console.error(`[Gemini] API call failed (model: ${model}):`, error instanceof Error ? error.message : error);
    return {
      data: null,
      groundingMetadata: null,
      groundingChunks: [],
      rawText: null,
      inputTokens: null,
      outputTokens: null,
    };
  }

  const rawText = response.text ?? null;
  const usage = (response as { usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number } })
    .usageMetadata;
  const inputTokens = typeof usage?.promptTokenCount === "number" ? usage.promptTokenCount : null;
  const outputTokens = typeof usage?.candidatesTokenCount === "number" ? usage.candidatesTokenCount : null;

  // Extract grounding metadata from the response
  const candidateGrounding = response.candidates?.[0]?.groundingMetadata as
    | GroundingMetadata
    | null
    | undefined;

  const groundingMetadata = candidateGrounding ?? null;

  // Extract verified grounding chunks (real URLs returned by Google Search)
  const groundingChunks: GroundingChunk[] = (
    candidateGrounding?.groundingChunks ?? []
  )
    .filter(
      (chunk): chunk is GroundingChunk =>
        typeof (chunk as GroundingChunk)?.uri === "string" &&
        typeof (chunk as GroundingChunk)?.title === "string",
    )
    .map((chunk) => ({
      uri: (chunk as GroundingChunk).uri,
      title: (chunk as GroundingChunk).title,
    }));

  if (!rawText) {
    console.error("[Gemini] API returned no text content");
    return { data: null, groundingMetadata, groundingChunks, rawText, inputTokens, outputTokens };
  }

  try {
    const parsed = parseJson(rawText);
    const validated = params.schema.safeParse(parsed);
    if (!validated.success) {
      console.error("[Gemini] Schema validation failed:", validated.error.issues.slice(0, 3));
      return { data: null, groundingMetadata, groundingChunks, rawText, inputTokens, outputTokens };
    }
    return { data: validated.data, groundingMetadata, groundingChunks, rawText, inputTokens, outputTokens };
  } catch (error) {
    console.error("[Gemini] JSON parse failed:", error instanceof Error ? error.message : error);
    return { data: null, groundingMetadata, groundingChunks, rawText, inputTokens, outputTokens };
  }
}
