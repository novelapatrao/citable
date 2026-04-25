# CITABLE.Ai — AI Weekender submission

**Track:** Virality
**Builder:** novelapatrao
**Live URL:** https://citable-novelapatraos-projects.vercel.app
**Repo:** https://github.com/novelapatrao/citable
**Sprint:** 2026-04-22 → 2026-04-25

---

## one-line pitch

paste any url — get a 0–100 score on how well chatgpt, claude, and perplexity can find and cite your site. plus a plain-english summary, quick wins, strategic fixes, and a generated FAQ schema you can paste straight onto your site. free, no signup, under a minute.

## what it does

1. **scans the live HTML** of any public URL with cheerio
2. **runs 7 rule-based AEO checks**:
   - AI crawler access (does robots.txt block GPTBot/ClaudeBot/PerplexityBot?)
   - Content without JavaScript (can crawlers read the page server-side?)
   - Structured data (schema.org JSON-LD)
   - llms.txt presence
   - Heading structure (one clear H1, sub-H2s)
   - Meta title + description (length, presence)
   - FAQ / Q&A content + FAQPage schema
3. **sends results + cleaned HTML to claude-sonnet-4-6** via the Anthropic SDK with structured output (Zod schema), prompt caching enabled
4. **renders a report** with: score (color-coded by tier — Invisible / Partially Seen / Citable / AI-Native), site context, "what this means for you" plain-English block, per-check notes, quick wins, strategic fixes, copy-paste code snippets, generated FAQ JSON-LD
5. **email-gated PDF download** — captures email to a Google Form, generates a real PDF client-side via html-to-image + jsPDF (oklab-safe)

## why virality (and where it falls short)

**fits the personalized-artifact rule the rubric calls out:**
> "What does a user screenshot from your product? If the answer is their personalized dashboard, result, stat card, label, or ranking — viral loop present."

every scan produces a unique, branded report card with a score, a label, and the user's specific site name. screenshot-worthy. it's the same loop as 16Personalities, Wordle's grid, GitHub year-in-review.

**the gap:** the loop only runs if a seed audience runs the first scans and shares them. this weekend the build absorbed all the time. distribution (LinkedIn launch post, WhatsApp asks, share buttons, OG image rollout) is the post-weekend plan, not in this submission.

## metrics — 4 days, honest

| Parameter | Number | Source |
|---|---|---|
| Unique visitors | 6 | Vercel Analytics |
| Page views | 12 | Vercel Analytics |
| Bounce rate | 50% | Vercel Analytics |
| Reports generated | ~6 | Vercel logs (visitors mostly hit `/` then `/report`) |
| Emails captured | 0 external | Google Form responses |
| LinkedIn impressions | 0 | post not published |
| LinkedIn reactions | 0 | — |
| Amplification (notable reshares) | 0 | — |

Vercel Analytics dashboard (read-only access): available on request via the Vercel project share link.

## rubric self-score (Virality — 164 base)

| Parameter | Weight | Level | Points |
|---|---|---|---|
| Impressions and views | 1× | L1 (under 500) | 0 |
| Reactions and comments | 2× | L1 (under 15) | 0 |
| Amplification quality | 3× | L1 (none) | 0 |
| Visitors to product | 10× | L1 (6, under 50) | 0 |
| Signups / meaningful actions | 25× | L1 (under 25) | 0 |
| **Total** | | | **0 / 164** |

build shipped. distribution didn't. that's the call.

## stack

- **frontend:** Next.js 16 (App Router) + React 19 + Tailwind v4 + framer-motion
- **scanner:** cheerio (HTML parsing) + native fetch with timeouts
- **AI analysis:** Anthropic SDK (`@anthropic-ai/sdk` v0.91), claude-sonnet-4-6, Zod-typed structured output, ephemeral prompt caching for the system prompt
- **PDF generation:** html-to-image (oklab-safe SVG foreignObject snapshotting) → jsPDF (multi-page A4 with 10mm margins)
- **email capture:** Google Form (no-cors POST from the browser, anonymous, free, no third-party signup)
- **analytics:** Vercel Web Analytics
- **OG image:** Next.js file-based metadata route (`app/opengraph-image.tsx` → 1200×630 PNG via `next/og` ImageResponse)
- **hosting:** Vercel (auto-deploy on push to main)
- **typography:** Geist Sans + Mono (UI) + Fraunces serif (display headlines)

## key build decisions

1. **dropped adaptive thinking + lowered effort to medium** on the AI call — cut scan time from ~93s → ~50s without quality regression on a structured output task.
2. **plain-english summary block** above the per-check breakdown — non-technical founders/marketers/agency owners are the target audience; the technical detail lives below for the developer reader who needs it.
3. **html-to-image instead of html2canvas** — Tailwind v4 emits oklab() colors that html2canvas can't parse. html-to-image's foreignObject SVG approach renders modern CSS natively.
4. **window.print() abandoned** — was the first PDF approach; works but injects browser URL/date headers on every page that can't be removed via CSS. Switched to client-side snapshot → jsPDF for full control.
5. **Google Form for email capture** — zero third-party signup, user owns the data forever, free. Trade-off: form must be explicitly published in the new Google Forms UI (silent failure mode that took debugging to find).

## post-weekend GTM plan

phase 1 — **launch (week 1):**
- LinkedIn launch post in "I've launched X" format (draft already in `weekender.md`)
- WhatsApp DM to ~20 close friends (template ready)
- post in 3 founder/marketer Slack/Discord communities

phase 2 — **virality loop (week 2):**
- add **share buttons** on the report page (LinkedIn, X, copy-link)
- generate a **shareable score card** (a smaller, social-optimized version of the report) — this is the screenshot-worthy artifact the rubric flags as essential
- "scan a competitor" CTA at the bottom of every report — primes the lateral share

phase 3 — **paid tier (week 3+):**
- deeper audit: scan all sub-pages, compare-against-competitor mode, scheduled rescans, white-label PDF
- $19/mo or $99 one-time per audit
- collect waitlist now via the email-gated PDF flow that's already live

## what's still in the pipeline (didn't ship)

- share buttons on report page
- shareable score card OG image (per-result, not per-site)
- haiku model swap option for 3× faster scans (~15s vs 50s)
- Convex for persistent saved reports
