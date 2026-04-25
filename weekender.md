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
- ☐ deployed to vercel
- ☐ shared on linkedin
- ☐ first 10 scans run

## live url
*(paste here once vercel finishes deploying)*

repo: https://github.com/novelapatrao/citable

## metrics (virality track)
| metric | target by 8pm | actual |
|---|---|---|
| scans run | 50 | _ |
| linkedin post impressions | 1000 | _ |
| linkedin reactions | 20 | _ |
| people who shared | 5 | _ |
| competitor sites scanned (proxy for serious use) | 10 | _ |

## daily log

### sat 2026-04-25
- 12:30 — installed handbook, picked up where i left off yesterday
- _____ — vercel deploy done, live url:
- _____ — linkedin post live
- _____ — first scan run by someone other than me
- _____ — submitted

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
