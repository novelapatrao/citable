# weekender — citable.ai

## track
**virality** — free tool, share-driven, metric is scans run.

## idea
**citable.ai** — paste a url, get a 0–100 score on how well chatgpt, claude, and perplexity can find and cite your site. plus a plain-english summary, quick wins, strategic fixes, and a generated FAQ.

free. no signup. ~50s per scan.

## first user
*(who would actually use this on day 1?)*
- founders auditing their own homepage
- agency owners running it on prospect sites before pitching
- marketers showing a client why they aren't appearing in chatgpt answers

primary first user: _______________________

## stage
- ✅ idea locked
- ✅ landing page live
- ✅ scanner working end-to-end (rule-based + claude analysis)
- ✅ pushed to github
- ✅ deployed to vercel
- ✅ email-gated PDF download (Google Form + html-to-image + jsPDF)
- ✅ vercel analytics + OG image for share previews
- ☐ shared on linkedin (deferred to post-weekend GTM)
- ☐ first 10 scans run by external users

## live url
**https://citable-novelapatraos-projects.vercel.app**

repo: https://github.com/novelapatrao/citable

## metrics (virality track) — final, sat 8pm cutoff
| metric | target | actual | source |
|---|---|---|---|
| visitors | 50 | 6 | Vercel Analytics |
| page views | — | 12 | Vercel Analytics |
| bounce rate | < 60% | 50% | Vercel Analytics |
| linkedin impressions | 1,000 | 0 (post not made) | — |
| linkedin reactions | 20 | 0 | — |
| amplification (notable reshares) | 1 | 0 | — |
| signups / emails captured | 25 | 0 external (test only) | Google Form |
| competitor sites scanned | 10 | 0 external | Vercel logs |

**Vercel rubric self-score (Virality): 0 / 164 base.** Build shipped, distribution didn't. GTM moved to post-weekend.

## daily log

### sat 2026-04-25
- 12:30 — installed growthx handbook, picked up where i left off yesterday
- 13:00 — brand renamed to CITABLE.Ai, plain-english summary block added to report
- 13:30 — speed tuning (sonnet 4-6 medium, no adaptive thinking, ~50s per scan)
- 14:00 — pushed to github (novelapatrao/citable), deployed to vercel
- 14:30 — built email-gated PDF download (real one-click, no print dialog)
- 15:00 — fixed Google Form (had to publish it explicitly)
- 15:30 — added Vercel Analytics + OG image for LinkedIn share preview
- 15:45 — drafted LinkedIn post + WhatsApp DM templates
- _____ — linkedin post not made; deferred GTM to post-weekend

### sun 2026-04-26
- 03:20 — checked Vercel Analytics: 6 visitors, 12 page views, 50% bounce
- 03:30 — assembled submission package (`submission.md`)
- _____ — submitted to GrowthX

### fri 2026-04-24
- built core scanner (7 rule-based checks)
- integrated claude analysis with structured output
- session ran out of context mid-build

## decisions / why
- **track = virality:** free tool, no signup, designed to be shared. metric is scans run, not paid signups.
- **no email gate:** keeps the funnel one click — paste url, see score. email gate goes on PDF download (planned, not blocking submission).
- **brand = CITABLE.Ai:** "citable" is also the third score tier (60–85). brand name == aspiration tier 3, intentional.

## what's still on the table
- email-gated pdf download (drafted, not built)
- speed: scan takes ~50s on real sites. could swap sonnet → haiku for 3x speedup with quality cost.
- share buttons + og image for virality
