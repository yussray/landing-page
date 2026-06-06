export type Provider = "gemini" | "openai";

export type BlueprintInput = {
  primaryKeyword: string;
  secondaryKeywords?: string;
  pageType: string;
  targetAudience: string;
  searchIntent: string;
  location?: string;
  brandVoice?: string;
  styleType?: string;
  customStyle?: string;
  email?: string;
  whatsapp?: string;
  designUiStyle?: string;
  language?: string;
  images?: string;
  videos?: string;
};

export type GenerateRequest =
  | { action: "blueprint"; provider: Provider; apiKey: string; input: BlueprintInput }
  | { action: "website"; provider: Provider; apiKey: string; blueprint: string };

const REQUIRED_LIMITS = {
  primaryKeyword: 160,
  pageType: 80,
  targetAudience: 240,
  searchIntent: 80,
} as const;

const OPTIONAL_LIMITS = {
  secondaryKeywords: 500,
  location: 160,
  brandVoice: 80,
  styleType: 80,
  customStyle: 1_500,
  email: 254,
  whatsapp: 40,
  designUiStyle: 300,
  language: 40,
  images: 1_500,
  videos: 1_500,
} as const;

function cleanString(value: unknown, field: string, maxLength: number, required = false) {
  if (typeof value !== "string") {
    if (required) throw new Error(`${field} is required.`);
    return undefined;
  }

  const cleaned = value.replace(/\0/g, "").trim();
  if (required && !cleaned) throw new Error(`${field} is required.`);
  if (cleaned.length > maxLength) {
    throw new Error(`${field} must be ${maxLength} characters or fewer.`);
  }

  return cleaned || undefined;
}

export function validateGenerateRequest(value: unknown): GenerateRequest {
  if (!value || typeof value !== "object") throw new Error("Invalid request body.");

  const body = value as Record<string, unknown>;
  if (body.provider !== "gemini" && body.provider !== "openai") {
    throw new Error("Invalid AI provider.");
  }

  const apiKey = cleanString(body.apiKey, "API key", 512, true)!;
  if (body.action === "website") {
    const blueprint = cleanString(body.blueprint, "blueprint", 12_000, true)!;
    return { action: "website", provider: body.provider, apiKey, blueprint };
  }

  if (body.action !== "blueprint" || !body.input || typeof body.input !== "object") {
    throw new Error("Invalid generation action.");
  }

  const input = body.input as Record<string, unknown>;
  const required = Object.fromEntries(
    Object.entries(REQUIRED_LIMITS).map(([field, limit]) => [
      field,
      cleanString(input[field], field, limit, true),
    ]),
  ) as Record<keyof typeof REQUIRED_LIMITS, string>;

  const optional = Object.fromEntries(
    Object.entries(OPTIONAL_LIMITS).map(([field, limit]) => [
      field,
      cleanString(input[field], field, limit),
    ]),
  );

  return {
    action: "blueprint",
    provider: body.provider,
    apiKey,
    input: { ...required, ...optional } as BlueprintInput,
  };
}
