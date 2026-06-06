import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import generateHandler from "../api/generate";
import { isAllowedOrigin, MAX_BODY_BYTES } from "../api/security";
import { validateGenerateRequest } from "../api/validation";

test("accepts same-origin requests", () => {
  const request = new Request("https://example.vercel.app/api/generate", {
    headers: {
      host: "example.vercel.app",
      origin: "https://example.vercel.app",
      "x-forwarded-proto": "https",
    },
  });

  assert.equal(isAllowedOrigin(request), true);
});

test("rejects cross-origin and originless requests", () => {
  const crossOrigin = new Request("https://example.vercel.app/api/generate", {
    headers: {
      host: "example.vercel.app",
      origin: "https://attacker.example",
      "x-forwarded-proto": "https",
    },
  });
  const originless = new Request("https://example.vercel.app/api/generate", {
    headers: { host: "example.vercel.app" },
  });

  assert.equal(isAllowedOrigin(crossOrigin), false);
  assert.equal(isAllowedOrigin(originless), false);
});

test("requires a provider key and trims blueprint input", () => {
  const payload = validateGenerateRequest({
    action: "blueprint",
    provider: "gemini",
    apiKey: "test-key",
    input: {
      primaryKeyword: "  secure SEO  ",
      pageType: "Landing Page",
      targetAudience: "Instructors",
      searchIntent: "Informational",
    },
  });

  assert.equal(payload.action, "blueprint");
  if (payload.action === "blueprint") {
    assert.equal(payload.input.primaryKeyword, "secure SEO");
    assert.equal(payload.apiKey, "test-key");
  }
});

test("rejects missing keys and oversized input", () => {
  assert.throws(
    () =>
      validateGenerateRequest({
        action: "blueprint",
        provider: "openai",
        apiKey: "",
        input: {
          primaryKeyword: "SEO",
          pageType: "Landing Page",
          targetAudience: "Instructors",
          searchIntent: "Informational",
        },
      }),
    /API key is required/,
  );

  assert.throws(
    () =>
      validateGenerateRequest({
        action: "website",
        provider: "gemini",
        apiKey: "test-key",
        blueprint: "x".repeat(12_001),
      }),
    /12000 characters or fewer/,
  );

  assert.equal(MAX_BODY_BYTES, 24_000);
});

test("API rejects cross-origin keys without echoing them", async () => {
  const secret = "sk-test-secret-value";
  const request = new Request("https://example.vercel.app/api/generate", {
    method: "POST",
    headers: {
      host: "example.vercel.app",
      origin: "https://attacker.example",
      "x-forwarded-proto": "https",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      action: "website",
      provider: "openai",
      apiKey: secret,
      blueprint: "test",
    }),
  });

  const response = await generateHandler.fetch(request);
  const body = await response.text();

  assert.equal(response.status, 403);
  assert.equal(body.includes(secret), false);
});

test("client build configuration contains no embedded provider secret path", async () => {
  const [viteConfig, clientService] = await Promise.all([
    readFile(new URL("../vite.config.ts", import.meta.url), "utf8"),
    readFile(new URL("../src/services/geminiService.ts", import.meta.url), "utf8"),
  ]);

  assert.equal(viteConfig.includes("GEMINI_API_KEY"), false);
  assert.equal(viteConfig.includes("OPENAI_API_KEY"), false);
  assert.equal(clientService.includes("dangerouslyAllowBrowser"), false);
  assert.equal(clientService.includes("@google/genai"), false);
  assert.equal(clientService.includes('from "openai"'), false);
});
