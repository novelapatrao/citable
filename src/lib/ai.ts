import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import * as cheerio from "cheerio";
import type { CheckResult } from "./scan";

const MODEL = "claude-sonnet-4-6";
const MAX_HTML_CHARS = 15_000;

// ————————————————————————————————————————
// Zod schema for AI output (structured outputs)
// Field names avoid hyphens for TS ergonomics; mapped back at render time.
// ————————————————————————————————————————
const aiAnalysisSchema = z
  .object({
    verdict: z.string(),
    plainSummary: z.string(),
    siteContext: z
      .object({
        brandName: z.string(),
        category: z.string(),
        oneLiner: z.string(),
      })
      .strict(),
    checkNotes: z
      .object({
        robots: z.string(),
        jsContent: z.string(),
        schema: z.string(),
        llmstxt: z.string(),
        headings: z.string(),
        meta: z.string(),
        faq: z.string(),
      })
      .strict(),
    quickWins: z.array(
      z
        .object({
          title: z.string(),
          description: z.string(),
        })
        .strict(),
    ),
    strategicFixes: z.array(
      z
        .object({
          title: z.string(),
          description: z.string(),
        })
        .strict(),
    ),
    generatedFaq: z.array(
      z
        .object({
          question: z.string(),
          answer: z.string(),
        })
        .strict(),
    ),
  })
  .strict();

export type AiAnalysis = z.infer<typeof aiAnalysisSchema>;

// Map from our CheckId → the camelCase key in checkNotes
const CHECK_ID_TO_NOTE_KEY: Record<string, keyof AiAnalysis["checkNotes"]> = {
  robots: "robots",
  "js-content": "jsContent",
  schema: "schema",
  llmstxt: "llmstxt",
  headings: "headings",
  meta: "meta",
  faq: "faq",
};

export function noteForCheck(
  analysis: AiAnalysis | null | undefined,
  checkId: string,
): string | undefined {
  if (!analysis) return undefined;
  const key = CHECK_ID_TO_NOTE_KEY[checkId];
  if (!key) return undefined;
  return analysis.checkNotes[key];
}

// ————————————————————————————————————————
// HTML cleaning — strip script/style, keep semantic text + meta + JSON-LD
// ————————————————————————————————————————
function cleanHtml(html: string): string {
  const $ = cheerio.load(html);

  // remove noise
  $("script:not([type='application/ld+json'])").remove();
  $("style, link[rel='stylesheet'], noscript, iframe, svg path, svg circle, svg rect").remove();

  // collapse whitespace in text nodes
  const cleaned = $.html()
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/\n\s*\n/g, "\n")
    .replace(/[ \t]+/g, " ");

  if (cleaned.length <= MAX_HTML_CHARS) return cleaned;
  return cleaned.slice(0, MAX_HTML_CHARS) + "\n<!-- TRUNCATED -->";
}

// ————————————————————————————————————————
// Prompts
// ————————————————————————————————————————
const SYSTEM_PROMPT = `You are an AEO (Answer Engine Optimization) analyst. You audit websites for how well AI engines — ChatGPT, Claude, Perplexity, Google AI Overviews — can find, parse, and cite their content.

Your AUDIENCE is non-technical: founders, marketers, and agency owners. They probably don't write code. They DO understand "your customer is asking ChatGPT and your competitor comes up instead of you." Write for them.

Your job is to produce a site-specific report for a website. You will receive:
1. The site's URL and hostname.
2. The results of 7 rule-based checks that ran against the live HTML (robots.txt, JS-rendered content, structured data, llms.txt, heading structure, meta tags, FAQ content).
3. The cleaned HTML of the homepage (head + body, truncated to ~25K chars, scripts and styles removed).

Deliver a precise, actionable report with ZERO fluff. Specifics beat generalities every time.

### Tone and writing style
- Direct, plain-English, confident. Never generic. Never hedging.
- Reference the brand by its real name. Reference the actual product category, features, USPs from the HTML.
- When you have to use a technical term (schema.org, JSON-LD, robots.txt), explain it in the same sentence in plain words. Example: "Add structured data — small bits of code that tell AI what kind of page this is — to your homepage."
- Every "quick win" must quote the site's CURRENT text (if applicable) and suggest replacement text in plain language. Do not say "add a FAQ" — say "Add a question on your page that answers 'How much fiber is in one can?' with the answer 'Each 330ml can has 7g of fiber — about 25% of what you need in a day.'"
- Stay factually grounded in the HTML. Do not invent products, features, or claims. If a claim is clear, use it; if not, leave it out.

### Output fields
- verdict: 2–3 sentences. Name the brand. Call out 1–2 real strengths and 1–2 real gaps. Set up the fixes. Plain English.
- plainSummary: 3–5 sentences. The "what this means for you" block. Frame this for a founder or marketer, not a developer. Tell them: (1) in one line, the situation — are AI tools finding their site or not? (2) what they're losing because of it (customers researching with AI go to a competitor) (3) the 1–2 highest-impact things they should do, named in plain English without code or jargon. End with a confidence note — "with these fixes, you'll move from X to Y." Read like a friendly consultant, not a code review.
- siteContext.brandName: inferred from HTML (title, header, og:site_name, etc.). If unclear, use the hostname.
- siteContext.category: short phrase like "D2C prebiotic beverage brand", "developer-tools SaaS", "B2B analytics platform".
- siteContext.oneLiner: one sentence describing what this company/page actually does, using language from the actual HTML.
- checkNotes: a short, plain-English paragraph per check. Reference site-specific evidence. Explain technical terms inline. If the site passes, explain WHY in plain words (e.g. "Your robots.txt file is the rulebook for web crawlers — yours explicitly says yes to ChatGPT, Claude, and Perplexity. Good."). If it fails, explain the failure in business terms first, then the technical detail.
- quickWins: 3–4 tactical fixes the user can ship today. Each has a punchy title and a specific, plain-English description. Quote current text or name exact content to add. No code-speak in titles. Bad: "Implement FAQPage JSON-LD". Good: "Add 5 questions your customers actually ask".
- strategicFixes: 2–3 bigger structural changes. Plain-English titles. Describe the why (business outcome) and the shape of the change (what changes on the site). Bad: "Implement Product schema markup". Good: "Tell AI engines exactly what you sell, in machine-readable form".
- generatedFaq: 4–6 real questions a user might ask an AI about this brand, with direct 1–3 sentence answers grounded in the HTML. These should be good enough to paste straight onto the site.

If the scan encountered an error or the HTML is empty, return minimal but truthful content rather than inventing.`;

// ————————————————————————————————————————
// Main entry point
// ————————————————————————————————————————
export async function analyzeSiteWithClaude({
  url,
  hostname,
  html,
  checks,
}: {
  url: string;
  hostname: string;
  html: string;
  checks: CheckResult[];
}): Promise<AiAnalysis | null> {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn("[ai] ANTHROPIC_API_KEY not set — skipping AI analysis");
    return null;
  }

  const client = new Anthropic();
  const cleanedHtml = cleanHtml(html);

  const checkSummary = checks
    .map(
      (c) =>
        `- [${c.passed ? "PASS" : "FAIL"}] ${c.id} (${c.name}): ${c.summary}${c.evidence ? `\n    evidence: ${c.evidence}` : ""}`,
    )
    .join("\n");

  const userContent = `URL: ${url}
Hostname: ${hostname}

### Rule-based check results
${checkSummary}

### Cleaned HTML
\`\`\`html
${cleanedHtml}
\`\`\`

Produce the structured analysis now.`;

  try {
    const response = await client.messages.parse({
      model: MODEL,
      max_tokens: 16_000,
      output_config: {
        effort: "medium",
        format: zodOutputFormat(aiAnalysisSchema),
      },
      system: [
        {
          type: "text",
          text: SYSTEM_PROMPT,
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [{ role: "user", content: userContent }],
    });

    if (!response.parsed_output) {
      console.warn("[ai] parse returned null — structured output failed");
      return null;
    }

    // Log cache activity for visibility
    const u = response.usage;
    console.log(
      `[ai] tokens: input=${u.input_tokens} cache_read=${u.cache_read_input_tokens ?? 0} cache_write=${u.cache_creation_input_tokens ?? 0} output=${u.output_tokens}`,
    );

    return response.parsed_output;
  } catch (err) {
    if (err instanceof Anthropic.APIError) {
      console.error(`[ai] API error ${err.status}:`, err.message);
    } else {
      console.error("[ai] unexpected error:", err);
    }
    return null;
  }
}
