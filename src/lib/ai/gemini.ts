import { GoogleGenAI } from "@google/genai";
import { z } from "zod";

import { DEFAULT_GEMINI_MODEL } from "@/lib/ai/prompts";

export type GroundedJsonResult<T> = {
  data: T | null;
  groundingMetadata: unknown;
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
    return { data: null, groundingMetadata: null, rawText: null };
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
  const groundingMetadata = response.candidates?.[0]?.groundingMetadata ?? null;
  if (!rawText) {
    return { data: null, groundingMetadata, rawText };
  }

  try {
    const parsed = parseJson(rawText);
    const validated = params.schema.safeParse(parsed);
    if (!validated.success) {
      return { data: null, groundingMetadata, rawText };
    }
    return { data: validated.data, groundingMetadata, rawText };
  } catch {
    return { data: null, groundingMetadata, rawText };
  }
}
