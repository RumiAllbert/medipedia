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
};

export function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({ apiKey });
}

function parseJson(text: string): unknown {
  const trimmed = text.trim();
  const maybeJson = trimmed.replace(/^```json\s*/i, "").replace(/```$/, "").trim();
  return JSON.parse(maybeJson);
}

export async function generateGroundedJson<T>(params: {
  prompt: string;
  schema: z.ZodType<T>;
  grounded?: boolean;
  maxOutputTokens?: number;
}): Promise<GroundedJsonResult<T>> {
  const client = getGeminiClient();
  if (!client) {
    return { data: null, groundingMetadata: null, groundingChunks: [], rawText: null };
  }

  const response = await client.models.generateContent({
    model: process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL,
    contents: params.prompt,
    config: {
      responseMimeType: "application/json",
      maxOutputTokens: params.maxOutputTokens ?? 2048,
      tools: params.grounded ? [{ googleSearch: {} }] : undefined,
    },
  });

  const rawText = response.text ?? null;

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
    return { data: null, groundingMetadata, groundingChunks, rawText };
  }

  try {
    const parsed = parseJson(rawText);
    const validated = params.schema.safeParse(parsed);
    if (!validated.success) {
      return { data: null, groundingMetadata, groundingChunks, rawText };
    }
    return { data: validated.data, groundingMetadata, groundingChunks, rawText };
  } catch {
    return { data: null, groundingMetadata, groundingChunks, rawText };
  }
}
