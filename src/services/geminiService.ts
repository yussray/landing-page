type Provider = "gemini" | "openai";

type BlueprintParams = {
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
  apiKey?: string;
  provider?: Provider;
};

type GenerateResponse = { text?: string; error?: string };

async function requestGeneration(body: unknown) {
  const response = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify(body),
  });

  const result = (await response.json()) as GenerateResponse;
  if (!response.ok || !result.text) {
    throw new Error(result.error || "Generation failed. Please try again.");
  }

  return result.text;
}

export function generateBlueprint(params: BlueprintParams) {
  const { apiKey = "", provider = "gemini", ...input } = params;
  return requestGeneration({ action: "blueprint", provider, apiKey, input });
}

export function generateWebsite(
  blueprint: string,
  apiKey = "",
  provider: Provider = "gemini",
) {
  return requestGeneration({ action: "website", provider, apiKey, blueprint });
}
