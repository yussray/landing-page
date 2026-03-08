import { GoogleGenAI } from "@google/genai";
import OpenAI from "openai";

function getGeminiInstance(apiKey?: string) {
  const keyToUse = apiKey || process.env.GEMINI_API_KEY;
  if (!keyToUse) throw new Error("Gemini API Key is missing.");
  return new GoogleGenAI({ apiKey: keyToUse });
}

function getOpenAIInstance(apiKey?: string) {
  const keyToUse = apiKey || process.env.OPENAI_API_KEY;
  if (!keyToUse) throw new Error("OpenAI API Key is missing.");
  return new OpenAI({ apiKey: keyToUse, dangerouslyAllowBrowser: true });
}

const systemInstruction = `
You are an expert SEO Page Blueprint Generator.
Your purpose is to create a search-intent-aligned, conversion-ready page skeleton before content drafting.
This skill ensures metadata, heading hierarchy, structured data, and CTA positioning are strategically defined prior to writing.

## Output Format
You MUST output the response in Markdown format, using the following structure exactly:

**SEO_Title:** [Title]
**Meta_Description:** [Description]
**URL_Slug:** [Slug]

**Primary_Keyword:** [Keyword]
**Secondary_Keywords:** [Keywords]

**Search_Intent_Alignment:**
[Brief 1–2 line explanation of intent match]

**H1:** [H1]

**H2_Sections:**
- [Section 1]
- [Section 2]
- [Section 3]
- [Section 4]
- [Section 5 (if required)]

**H3_Subsections:**
- [Subsection 1]
- [Subsection 2]
- [Subsection 3]

**Content_Angle_Notes:**
- [Perspective positioning]
- [Differentiation strategy]
- [Trust elements to include]

**Internal_Link_Suggestions:**
- [Page 1]
- [Page 2]

**External_Link_Type:**
[Authority source type if needed]

**FAQ_Section:**
**Q1:** [Question 1]
**Q2:** [Question 2]
**Q3:** [Question 3]
**Q4:** [Question 4]

**CTA_Placement:**
- **Above_Fold:** [CTA]
- **Mid_Page:** [CTA]
- **Pre_FAQ:** [CTA]
- **Bottom:** [CTA]

**Schema_Type:**
[Organization / Service / FAQ / Article / LocalBusiness / Product]

**Conversion_Goal:**
[Lead / Booking / Download / Purchase / Subscribe]

## Execution Steps
1. Identify primary keyword and confirm search intent.
2. Match page type to user intent.
3. Craft SEO title (≤ 60 characters, keyword included naturally).
4. Write meta description (150–160 characters, benefit-driven).
5. Create H1 with natural keyword integration.
6. Structure logical H2 sections aligned with search intent.
7. Add H3 where complexity requires breakdown.
8. Generate FAQ section from People Also Ask–style logic.
9. Define CTA placement for conversion flow.
10. Select correct schema type.
11. Ensure no full content paragraphs are written.

## Decision Tree
If Search Intent = Informational:
→ Emphasize education, definitions, how-to sections.
→ CTA soft (download guide / learn more).

If Search Intent = Commercial:
→ Include comparison, benefits, proof elements.
→ CTA mid-page and bottom.

If Search Intent = Transactional:
→ Strong CTA above fold.
→ Add trust signals and proof structure.

If Local SEO:
→ Include location in H1 or H2.
→ Add LocalBusiness schema.

## Constraints
- Do NOT write full content paragraphs.
- Do NOT exceed character limits for metadata.
- Do NOT keyword stuff.
- Keep structure clean and logically sequenced.
- Output must remain in structured labeled format only.
- No explanations outside defined sections.
`;

export async function generateBlueprint(params: {
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
  provider?: "gemini" | "openai";
}) {
  const prompt = `
Generate an SEO Page Blueprint with the following inputs:
- Primary Keyword: ${params.primaryKeyword}
- Secondary Keywords: ${params.secondaryKeywords || "None"}
- Page Type: ${params.pageType}
- Target Audience: ${params.targetAudience}
- Search Intent: ${params.searchIntent}
- Location: ${params.location || "None"}
- Brand Voice: ${params.brandVoice || "None"}
- Style Type: ${params.styleType || "None"}
- Design UI Style: ${params.designUiStyle || "None"}
- Custom Style Request: ${params.customStyle || "None"}
- Images to Include: ${params.images || "None"}
- Videos to Include: ${params.videos || "None"}
- Contact Email: ${params.email || "None"}
- Contact WhatsApp: ${params.whatsapp || "None"}
- Language: ${params.language || "English"}

Note: If Contact Email or Contact WhatsApp are provided, consider incorporating them into the CTA_Placement section.
Note: The output MUST be in the requested Language (${params.language || "English"}).
  `;

  if (params.provider === "openai") {
    const openai = getOpenAIInstance(params.apiKey);
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemInstruction },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
    });
    return response.choices[0].message.content || "";
  } else {
    // Default to Gemini
    const ai = getGeminiInstance(params.apiKey);
    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });
    return response.text;
  }
}

export async function generateWebsite(blueprint: string, apiKey?: string, provider?: "gemini" | "openai") {
  const prompt = `
You are an expert web developer and designer.
Based on the following SEO Page Blueprint, generate a complete, responsive, and modern HTML landing page.
Use Tailwind CSS via CDN for styling (<script src="https://cdn.tailwindcss.com"></script>).
Include appropriate placeholder images (e.g., from Unsplash or Picsum) or use the specific image URLs provided in the blueprint.
If videos are mentioned, embed responsive video placeholders or the provided video URLs.
Ensure the design matches the requested Design UI Style, Style Type, and brand voice from the blueprint.
Include the contact email and WhatsApp number in the CTA sections if they are present in the blueprint.
Ensure the text is in the language specified in the blueprint.
Make sure the page looks polished, modern, and ready to be published.

Return ONLY valid HTML code. Do not include markdown formatting like \`\`\`html.

Blueprint:
${blueprint}
  `;

  if (provider === "openai") {
    const openai = getOpenAIInstance(apiKey);
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are an expert web developer and designer." },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
    });
    let html = response.choices[0].message.content || "";
    html = html.replace(/^```html\n?/, "").replace(/\n?```$/, "");
    return html;
  } else {
    // Default to Gemini
    const ai = getGeminiInstance(apiKey);
    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: prompt,
      config: {
        temperature: 0.7,
      },
    });
    let html = response.text || "";
    html = html.replace(/^```html\n?/, "").replace(/\n?```$/, "");
    return html;
  }
}
