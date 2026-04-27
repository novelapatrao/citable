import * as cheerio from "cheerio";
import { analyzeSiteWithClaude, type AiAnalysis } from "./ai";

export type CheckId =
  | "robots"
  | "schema"
  | "llmstxt"
  | "js-content"
  | "headings"
  | "meta"
  | "faq";

export type Severity = "critical" | "high" | "medium" | "low";

export type CheckResult = {
  id: CheckId;
  name: string;
  passed: boolean;
  severity: Severity;
  weight: number;
  summary: string;
  evidence?: string;
  fix?: {
    headline: string;
    instructions: string;
    code?: string;
  };
};

export type ScanLabel =
  | "Invisible"
  | "Partially Seen"
  | "Citable"
  | "AI-Native";

export type ScanResult = {
  url: string;
  normalizedUrl: string;
  scannedAt: string;
  score: number;
  label: ScanLabel;
  checks: CheckResult[];
  topFixIds: CheckId[];
  aiAnalysis?: AiAnalysis | null;
  error?: string;
};

const TIMEOUT_MS = 12000;
const USER_AGENT = "CitableBot/1.0 (AI-readiness audit)";

const AI_BOTS = [
  "GPTBot",
  "ChatGPT-User",
  "OAI-SearchBot",
  "ClaudeBot",
  "anthropic-ai",
  "Claude-Web",
  "PerplexityBot",
  "Perplexity-User",
  "Google-Extended",
  "CCBot",
  "cohere-ai",
  "Bytespider",
  "Applebot-Extended",
  "FacebookBot",
  "meta-externalagent",
];

const WEIGHTS: Record<CheckId, number> = {
  robots: 22,
  "js-content": 20,
  schema: 18,
  llmstxt: 10,
  headings: 10,
  meta: 10,
  faq: 10,
};

async function fetchWithTimeout(
  url: string,
  init?: RequestInit,
): Promise<Response> {
  const MAX_REDIRECTS = 5;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    let currentUrl = url;
    for (let hop = 0; ; hop++) {
      // Re-validate every hop — defends against Location: redirects to
      // internal addresses (e.g. evil.com → 169.254.169.254).
      assertSafeUrl(new URL(currentUrl));
      const res = await fetch(currentUrl, {
        ...init,
        signal: controller.signal,
        headers: {
          "User-Agent": USER_AGENT,
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          ...init?.headers,
        },
        redirect: "manual",
      });
      const loc = res.headers.get("location");
      if (res.status < 300 || res.status >= 400 || !loc) return res;
      if (hop >= MAX_REDIRECTS) throw new Error("too-many-redirects");
      currentUrl = new URL(loc, currentUrl).toString();
    }
  } finally {
    clearTimeout(timeout);
  }
}

function normalizeUrl(raw: string): string {
  let url = raw.trim();
  if (!/^https?:\/\//i.test(url)) url = "https://" + url;
  return url;
}

// SSRF guard. Rejects literal-IP and well-known-name attacks against internal
// infra (loopback, RFC1918, link-local incl. cloud metadata, ULA, etc.).
// Note: DNS rebinding and public hostnames that A-record to private IPs
// (localtest.me, *.nip.io) are out of scope — closing those needs DNS
// resolution at validation time and fetch-by-IP.
function assertSafeUrl(parsed: URL): void {
  const proto = parsed.protocol.toLowerCase();
  if (proto !== "http:" && proto !== "https:") {
    throw new Error("unsafe-url");
  }

  let host = parsed.hostname.toLowerCase();
  if (!host) throw new Error("unsafe-url");

  // Strip trailing FQDN dot — DNS resolves "localhost." the same as "localhost".
  if (host.endsWith(".") && host.length > 1) host = host.slice(0, -1);

  // Node keeps brackets on IPv6 hostnames (e.g. "[::1]") — strip them so the
  // string checks below actually fire.
  if (host.startsWith("[") && host.endsWith("]")) {
    host = host.slice(1, -1);
  }

  if (host === "localhost") throw new Error("unsafe-url");
  if (host.endsWith(".local")) throw new Error("unsafe-url");
  if (host.endsWith(".localhost")) throw new Error("unsafe-url");

  // IPv6 literals — ":" can't appear in DNS hostnames.
  if (host.includes(":")) {
    // Block any "::" prefix — covers ::, ::1, ::ffff:* (IPv4-mapped) and
    // ::w.x.y.z (IPv4-compatible, e.g. "::127.0.0.1" → "::7f00:1"). All of
    // ::/96 is reserved; nothing public lives there.
    if (host.startsWith("::")) throw new Error("unsafe-url");
    // fc00::/7 — unique local
    if (host.startsWith("fc") || host.startsWith("fd")) {
      throw new Error("unsafe-url");
    }
    // fe80::/10 — link-local. fe80–febf, so the second hex digit is 8–b.
    if (
      host.startsWith("fe8") ||
      host.startsWith("fe9") ||
      host.startsWith("fea") ||
      host.startsWith("feb")
    ) {
      throw new Error("unsafe-url");
    }
    return;
  }

  // IPv4 dotted-quad. Node's WHATWG URL parser canonicalizes other numeric
  // forms (2130706433, 0x7f000001, 0177.0.0.1, 127.1) to dotted-quad before
  // we see them, so a single regex check is sufficient.
  const v4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(host);
  if (v4) {
    const a = Number(v4[1]);
    const b = Number(v4[2]);
    const c = Number(v4[3]);
    const d = Number(v4[4]);
    for (const o of [a, b, c, d]) {
      if (o < 0 || o > 255) throw new Error("unsafe-url");
    }
    if (a === 0) throw new Error("unsafe-url");
    if (a === 10) throw new Error("unsafe-url");
    if (a === 127) throw new Error("unsafe-url");
    if (a === 169 && b === 254) throw new Error("unsafe-url");
    if (a === 172 && b >= 16 && b <= 31) throw new Error("unsafe-url");
    if (a === 192 && b === 168) throw new Error("unsafe-url");
    if (a === 100 && b >= 64 && b <= 127) throw new Error("unsafe-url");
  }
}

function labelFor(score: number): ScanLabel {
  if (score <= 30) return "Invisible";
  if (score <= 60) return "Partially Seen";
  if (score <= 85) return "Citable";
  return "AI-Native";
}

// ————————————————————————————————————————
// Check: robots.txt — does it block AI crawlers?
// ————————————————————————————————————————
async function checkRobots(origin: string): Promise<CheckResult> {
  const base: Omit<CheckResult, "passed" | "summary"> = {
    id: "robots",
    name: "AI crawler access",
    severity: "critical",
    weight: WEIGHTS.robots,
  };

  try {
    const res = await fetchWithTimeout(`${origin}/robots.txt`);
    if (!res.ok) {
      // no robots.txt → nothing is blocked → PASS
      return {
        ...base,
        passed: true,
        summary:
          "No robots.txt — AI crawlers can access the site without restriction.",
        evidence: `GET /robots.txt → ${res.status}`,
      };
    }
    const text = await res.text();
    const blocked = findBlockedAiBots(text);
    if (blocked.length === 0) {
      return {
        ...base,
        passed: true,
        summary:
          "robots.txt allows AI crawlers (ChatGPT, Claude, Perplexity, Google AI).",
      };
    }
    return {
      ...base,
      passed: false,
      summary: `${blocked.length} AI crawler${blocked.length > 1 ? "s are" : " is"} blocked in robots.txt.`,
      evidence: `Blocked bots: ${blocked.join(", ")}`,
      fix: {
        headline: "Unblock AI crawlers in robots.txt",
        instructions:
          "Your robots.txt is telling major AI tools to stay out. This is the #1 reason sites don't show up in ChatGPT or Perplexity answers. Replace the blocking rules with explicit allows — or remove them entirely.",
        code: [
          "# Allow AI crawlers (add or replace in robots.txt)",
          "User-agent: GPTBot",
          "Allow: /",
          "",
          "User-agent: ClaudeBot",
          "Allow: /",
          "",
          "User-agent: PerplexityBot",
          "Allow: /",
          "",
          "User-agent: Google-Extended",
          "Allow: /",
          "",
          "User-agent: CCBot",
          "Allow: /",
        ].join("\n"),
      },
    };
  } catch {
    return {
      ...base,
      passed: false,
      summary: "Could not reach robots.txt.",
      evidence: "Request failed or timed out.",
    };
  }
}

function findBlockedAiBots(robotsTxt: string): string[] {
  type Block = { agents: string[]; disallows: string[] };
  const blocks: Block[] = [];
  let current: Block | null = null;
  let lastWasAgent = false;

  const lines = robotsTxt.split(/\r?\n/).map((l) => l.split("#")[0].trim());

  for (const line of lines) {
    if (!line) {
      // blank line ends a block
      if (current && current.disallows.length > 0) {
        blocks.push(current);
        current = null;
      }
      lastWasAgent = false;
      continue;
    }
    const [rawKey, ...rawRest] = line.split(":");
    const key = rawKey?.toLowerCase().trim();
    const value = rawRest.join(":").trim();
    if (key === "user-agent") {
      if (!current || !lastWasAgent) {
        if (current && current.disallows.length > 0) blocks.push(current);
        current = { agents: [], disallows: [] };
      }
      current.agents.push(value);
      lastWasAgent = true;
    } else if (key === "disallow") {
      if (!current) current = { agents: [], disallows: [] };
      current.disallows.push(value);
      lastWasAgent = false;
    } else {
      lastWasAgent = false;
    }
  }
  if (current && current.agents.length > 0) blocks.push(current);

  const blocked = new Set<string>();
  for (const block of blocks) {
    const fullyBlocked = block.disallows.some((d) => d === "/");
    if (!fullyBlocked) continue;
    for (const agent of block.agents) {
      const match = AI_BOTS.find(
        (b) => b.toLowerCase() === agent.toLowerCase(),
      );
      if (match) blocked.add(match);
    }
  }
  return [...blocked];
}

// ————————————————————————————————————————
// Check: llms.txt — does the site have one?
// ————————————————————————————————————————
async function checkLlmsTxt(origin: string): Promise<CheckResult> {
  const base: Omit<CheckResult, "passed" | "summary"> = {
    id: "llmstxt",
    name: "llms.txt file",
    severity: "medium",
    weight: WEIGHTS.llmstxt,
  };

  try {
    const res = await fetchWithTimeout(`${origin}/llms.txt`);
    const text = res.ok ? await res.text() : "";
    const looksLikeLlmsTxt =
      res.ok && text.trim().length > 20 && !text.includes("<html");
    if (looksLikeLlmsTxt) {
      return {
        ...base,
        passed: true,
        summary: "llms.txt is present and gives AI a guided map of your site.",
        evidence: `${text.split(/\r?\n/).length} lines found at /llms.txt`,
      };
    }
    return {
      ...base,
      passed: false,
      summary: "No llms.txt file at the site root.",
      evidence: res.ok
        ? "/llms.txt returned HTML, not a plain-text listing"
        : `GET /llms.txt → ${res.status}`,
      fix: {
        headline: "Add an llms.txt file",
        instructions:
          "llms.txt is a new standard for telling AI what's on your site. Think of it as a sitemap for language models. Create a file at the root of your site and point to your most important pages.",
        code: [
          "# Your Company — llms.txt",
          "",
          "> One-sentence description of what your company does.",
          "",
          "## Docs",
          "- [Getting started](https://yoursite.com/docs/start): Quick intro",
          "- [API reference](https://yoursite.com/docs/api): Endpoints and auth",
          "",
          "## About",
          "- [Team](https://yoursite.com/team): Who we are",
          "- [Pricing](https://yoursite.com/pricing): Plans and trial info",
        ].join("\n"),
      },
    };
  } catch {
    return {
      ...base,
      passed: false,
      summary: "Could not check for llms.txt.",
      evidence: "Request failed.",
    };
  }
}

// ————————————————————————————————————————
// Check: Schema.org — structured data
// ————————————————————————————————————————
function checkSchema($: cheerio.CheerioAPI): CheckResult {
  const base: Omit<CheckResult, "passed" | "summary"> = {
    id: "schema",
    name: "Structured data (schema.org)",
    severity: "high",
    weight: WEIGHTS.schema,
  };

  const jsonLdBlocks = $('script[type="application/ld+json"]');
  const microdata = $("[itemscope]");

  const validTypes: string[] = [];
  jsonLdBlocks.each((_, el) => {
    const txt = $(el).contents().text();
    try {
      const parsed = JSON.parse(txt);
      const items = Array.isArray(parsed) ? parsed : [parsed];
      for (const item of items) {
        const type = item?.["@type"];
        if (typeof type === "string") validTypes.push(type);
        else if (Array.isArray(type)) validTypes.push(...type);
        if (item?.["@graph"]) {
          for (const g of item["@graph"]) {
            const t = g?.["@type"];
            if (typeof t === "string") validTypes.push(t);
            else if (Array.isArray(t)) validTypes.push(...t);
          }
        }
      }
    } catch {
      // invalid JSON-LD — skip
    }
  });

  if (validTypes.length > 0) {
    const unique = [...new Set(validTypes)];
    return {
      ...base,
      passed: true,
      summary: `JSON-LD structured data detected (${unique.slice(0, 3).join(", ")}${unique.length > 3 ? "…" : ""}).`,
      evidence: `${jsonLdBlocks.length} JSON-LD block${jsonLdBlocks.length > 1 ? "s" : ""} found.`,
    };
  }

  if (microdata.length > 0) {
    return {
      ...base,
      passed: true,
      summary: "Microdata structured data detected.",
      evidence: `${microdata.length} itemscope element(s).`,
    };
  }

  return {
    ...base,
    passed: false,
    summary: "No structured data found — AI can't tell what this page is about.",
    evidence: "No JSON-LD or microdata on the page.",
    fix: {
      headline: "Add schema.org JSON-LD to your page",
      instructions:
        "Structured data is the single biggest lever for AI understanding. It tells AI exactly what kind of page this is (product, article, FAQ, org). Paste this into your <head> and customize the values.",
      code: [
        '<script type="application/ld+json">',
        "{",
        '  "@context": "https://schema.org",',
        '  "@type": "Organization",',
        '  "name": "Your Company",',
        '  "url": "https://yoursite.com",',
        '  "description": "One sentence about what you do.",',
        '  "sameAs": [',
        '    "https://twitter.com/yourhandle",',
        '    "https://linkedin.com/company/yourhandle"',
        "  ]",
        "}",
        "</script>",
      ].join("\n"),
    },
  };
}

// ————————————————————————————————————————
// Check: Content without JavaScript
// ————————————————————————————————————————
function checkJsContent(
  $: cheerio.CheerioAPI,
  rawHtml: string,
): CheckResult {
  const base: Omit<CheckResult, "passed" | "summary"> = {
    id: "js-content",
    name: "Content without JavaScript",
    severity: "critical",
    weight: WEIGHTS["js-content"],
  };

  // strip script/style/noscript
  const $body = $("body").clone();
  $body.find("script, style, noscript, svg, iframe").remove();
  const text = $body.text().replace(/\s+/g, " ").trim();
  const words = text.split(" ").filter(Boolean);
  const wordCount = words.length;

  // heuristic: if body is tiny and page is mostly a root div, it's probably JS-only
  const hasRootDivOnly =
    /<div\s+id=["']?(root|app|__next)["']?[^>]*>\s*<\/div>/i.test(rawHtml);

  if (wordCount < 40 || hasRootDivOnly) {
    return {
      ...base,
      passed: false,
      summary: `Only ${wordCount} words visible without JavaScript — AI crawlers can't read your content.`,
      evidence: hasRootDivOnly
        ? "Page appears to be a client-rendered SPA shell."
        : `Body text is ${wordCount} words long.`,
      fix: {
        headline: "Render content server-side (SSR) or statically",
        instructions:
          "Many AI crawlers don't execute JavaScript. If your content only appears after JS runs, they see an empty page. Move to server-side rendering (SSR) or static generation. If you're on Next.js, Astro, Remix, or Gatsby, you likely already have this — just audit your pages. If you're on React SPA, Vue SPA, or similar, you need SSR (Next.js, Nuxt) or pre-rendering (Prerender.io, react-snap).",
      },
    };
  }

  return {
    ...base,
    passed: true,
    summary: `${wordCount} words visible without JavaScript — AI can read your content.`,
    evidence: `Body text length: ${wordCount} words.`,
  };
}

// ————————————————————————————————————————
// Check: H1/H2 structure
// ————————————————————————————————————————
function checkHeadings($: cheerio.CheerioAPI): CheckResult {
  const base: Omit<CheckResult, "passed" | "summary"> = {
    id: "headings",
    name: "Heading structure",
    severity: "medium",
    weight: WEIGHTS.headings,
  };

  const h1s = $("h1")
    .map((_, el) => $(el).text().trim())
    .get()
    .filter(Boolean);
  const h2s = $("h2").length;
  const h1Count = h1s.length;

  if (h1Count === 1 && h2s >= 1) {
    return {
      ...base,
      passed: true,
      summary: `Clean heading structure: 1 H1 and ${h2s} H2${h2s > 1 ? "s" : ""}.`,
      evidence: `H1: "${h1s[0].slice(0, 60)}${h1s[0].length > 60 ? "…" : ""}"`,
    };
  }

  if (h1Count === 0) {
    return {
      ...base,
      passed: false,
      summary: "No H1 found — AI can't identify the main topic of the page.",
      evidence: "0 H1 tags on the page.",
      fix: {
        headline: "Add one clear H1 to the page",
        instructions:
          "Your H1 is the page's headline. AI uses it like a table of contents entry. Add one H1 near the top of your page that describes what the page is about.",
        code: "<h1>Your page's main topic goes here</h1>",
      },
    };
  }

  if (h1Count > 1) {
    return {
      ...base,
      passed: false,
      summary: `${h1Count} H1 tags found — AI doesn't know which is the main topic.`,
      evidence: `H1s: ${h1s.slice(0, 3).map((h) => `"${h.slice(0, 30)}"`).join(", ")}${h1Count > 3 ? "…" : ""}`,
      fix: {
        headline: "Keep exactly one H1 per page",
        instructions:
          "Only the most important headline should be an H1. Change the rest to H2s or H3s. Your main H1 should describe the whole page; H2s break it into sections.",
      },
    };
  }

  return {
    ...base,
    passed: false,
    summary: `H1 found but no H2s — the page has no sub-structure for AI.`,
    evidence: `${h1Count} H1, ${h2s} H2s`,
    fix: {
      headline: "Break your page into H2 sections",
      instructions:
        "Long sections of text without H2s are hard for AI to summarize. Break your page into 2–5 sections, each starting with an H2 that describes what's in it.",
    },
  };
}

// ————————————————————————————————————————
// Check: Meta title + description
// ————————————————————————————————————————
function checkMeta($: cheerio.CheerioAPI): CheckResult {
  const base: Omit<CheckResult, "passed" | "summary"> = {
    id: "meta",
    name: "Meta title & description",
    severity: "medium",
    weight: WEIGHTS.meta,
  };

  const title = $("title").first().text().trim();
  const description = $('meta[name="description"]').attr("content")?.trim() || "";

  const titleOk = title.length >= 10 && title.length <= 70;
  const descOk = description.length >= 50 && description.length <= 160;

  if (titleOk && descOk) {
    return {
      ...base,
      passed: true,
      summary: "Title and description are well-formed and AI-friendly.",
      evidence: `Title: ${title.length} chars · Description: ${description.length} chars`,
    };
  }

  const problems: string[] = [];
  if (!title) problems.push("missing <title>");
  else if (title.length < 10) problems.push(`title too short (${title.length} chars)`);
  else if (title.length > 70) problems.push(`title too long (${title.length} chars)`);
  if (!description) problems.push("missing meta description");
  else if (description.length < 50) problems.push(`description too short (${description.length} chars)`);
  else if (description.length > 160) problems.push(`description too long (${description.length} chars)`);

  return {
    ...base,
    passed: false,
    summary: `Meta tags need work: ${problems.join(", ")}.`,
    evidence: title
      ? `Title: "${title.slice(0, 80)}"${description ? `\nDescription: "${description.slice(0, 100)}"` : ""}`
      : "No <title> tag found.",
    fix: {
      headline: "Fix your title and description",
      instructions:
        "AI uses your title and meta description to understand the page before reading the body. Aim for title: 50–60 characters. Description: 140–160 characters. Both should be descriptive, specific, and include the main topic.",
      code: [
        "<title>Your Page Topic — Your Brand (50–60 chars)</title>",
        '<meta name="description" content="One clear sentence describing what this page is about, including the main keyword or topic. Aim for 140–160 characters." />',
      ].join("\n"),
    },
  };
}

// ————————————————————————————————————————
// Check: FAQ / Q&A content
// ————————————————————————————————————————
function checkFaq($: cheerio.CheerioAPI, html: string): CheckResult {
  const base: Omit<CheckResult, "passed" | "summary"> = {
    id: "faq",
    name: "FAQ / Q&A content",
    severity: "low",
    weight: WEIGHTS.faq,
  };

  // 1) FAQPage schema in JSON-LD
  let hasFaqSchema = false;
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const data = JSON.parse($(el).contents().text());
      const items = Array.isArray(data) ? data : [data];
      for (const item of items) {
        const t = item?.["@type"];
        const types = Array.isArray(t) ? t : [t];
        if (types.some((x) => typeof x === "string" && /faq/i.test(x))) {
          hasFaqSchema = true;
        }
        if (item?.["@graph"]) {
          for (const g of item["@graph"]) {
            const gt = g?.["@type"];
            const gtypes = Array.isArray(gt) ? gt : [gt];
            if (gtypes.some((x) => typeof x === "string" && /faq/i.test(x))) {
              hasFaqSchema = true;
            }
          }
        }
      }
    } catch {
      // skip
    }
  });

  // 2) <details>/<summary> accordion-style FAQ
  const detailsCount = $("details").length;

  // 3) question-like headings
  const questionHeadings = $("h2, h3, h4")
    .map((_, el) => $(el).text().trim())
    .get()
    .filter(
      (t) =>
        t.endsWith("?") ||
        /^(what|why|how|when|where|who|can|do|does|is|are|should)\b/i.test(t),
    ).length;

  if (hasFaqSchema) {
    return {
      ...base,
      passed: true,
      summary: "FAQ schema detected — AI can cite your answers directly.",
    };
  }

  if (detailsCount >= 3 || questionHeadings >= 3) {
    return {
      ...base,
      passed: true,
      summary: `Question-style content found (${questionHeadings} Q-headings, ${detailsCount} accordion items).`,
    };
  }

  return {
    ...base,
    passed: false,
    summary: "No FAQ-style content or FAQPage schema — missing a big citation surface.",
    evidence: "AI loves to cite direct Q&A. You don't have any detected.",
    fix: {
      headline: "Add an FAQ section with FAQPage schema",
      instructions:
        "Pages with clear 'What is X?' / 'How does Y work?' questions get cited 3–5× more often by AI answer engines. Add 3–5 real questions your users ask, and wrap them in FAQPage schema so AI knows to cite them verbatim.",
      code: [
        '<script type="application/ld+json">',
        "{",
        '  "@context": "https://schema.org",',
        '  "@type": "FAQPage",',
        '  "mainEntity": [',
        "    {",
        '      "@type": "Question",',
        '      "name": "What does your product do?",',
        '      "acceptedAnswer": {',
        '        "@type": "Answer",',
        '        "text": "Short, direct answer. One sentence is ideal."',
        "      }",
        "    },",
        "    {",
        '      "@type": "Question",',
        '      "name": "How is it different from [competitor]?",',
        '      "acceptedAnswer": {',
        '        "@type": "Answer",',
        '        "text": "Another direct answer."',
        "      }",
        "    }",
        "  ]",
        "}",
        "</script>",
      ].join("\n"),
    },
  };
}

// ————————————————————————————————————————
// Main entry point
//
// Pass `{ aiOff: true }` to skip the Claude call — used by the OG image route
// where we need a fast deterministic score within LinkedIn's ~5s fetch budget.
// ————————————————————————————————————————
export async function scanSite(
  rawUrl: string,
  opts: { aiOff?: boolean } = {},
): Promise<ScanResult> {
  const normalizedUrl = normalizeUrl(rawUrl);
  const now = new Date().toISOString();

  let origin: string;
  try {
    const parsed = new URL(normalizedUrl);
    assertSafeUrl(parsed);
    origin = parsed.origin;
  } catch (e) {
    const isUnsafe = e instanceof Error && e.message === "unsafe-url";
    return {
      url: rawUrl,
      normalizedUrl,
      scannedAt: now,
      score: 0,
      label: "Invisible",
      checks: [],
      topFixIds: [],
      error: isUnsafe
        ? "That URL looks like an internal address. Try a public website."
        : "That doesn't look like a valid URL. Try something like example.com.",
    };
  }

  let html = "";
  try {
    const res = await fetchWithTimeout(normalizedUrl);
    if (!res.ok) {
      return {
        url: rawUrl,
        normalizedUrl,
        scannedAt: now,
        score: 0,
        label: "Invisible",
        checks: [],
        topFixIds: [],
        error: `Site returned HTTP ${res.status}. Can't scan a page that's not reachable.`,
      };
    }
    html = await res.text();
  } catch {
    return {
      url: rawUrl,
      normalizedUrl,
      scannedAt: now,
      score: 0,
      label: "Invisible",
      checks: [],
      topFixIds: [],
      error: `Couldn't reach ${normalizedUrl}. Check the URL or try again.`,
    };
  }

  const $ = cheerio.load(html);

  const [robots, llmstxt] = await Promise.all([
    checkRobots(origin),
    checkLlmsTxt(origin),
  ]);

  const checks: CheckResult[] = [
    robots,
    checkJsContent($, html),
    checkSchema($),
    llmstxt,
    checkHeadings($),
    checkMeta($),
    checkFaq($, html),
  ];

  const totalWeight = Object.values(WEIGHTS).reduce((a, b) => a + b, 0);
  const earnedWeight = checks
    .filter((c) => c.passed)
    .reduce((sum, c) => sum + c.weight, 0);
  const score = Math.round((earnedWeight / totalWeight) * 100);

  const severityRank: Record<Severity, number> = {
    critical: 4,
    high: 3,
    medium: 2,
    low: 1,
  };

  const topFixIds = checks
    .filter((c) => !c.passed && c.fix)
    .sort((a, b) => {
      const sev = severityRank[b.severity] - severityRank[a.severity];
      if (sev !== 0) return sev;
      return b.weight - a.weight;
    })
    .slice(0, 3)
    .map((c) => c.id);

  const hostname = new URL(normalizedUrl).hostname;
  const aiAnalysis = opts.aiOff
    ? null
    : await analyzeSiteWithClaude({
        url: normalizedUrl,
        hostname,
        html,
        checks,
      });

  return {
    url: rawUrl,
    normalizedUrl,
    scannedAt: now,
    score,
    label: labelFor(score),
    checks,
    topFixIds,
    aiAnalysis,
  };
}
