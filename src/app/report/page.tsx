import {
  scanSite,
  type ScanResult,
  type ScanLabel,
  type CheckResult,
} from "@/lib/scan";
import { noteForCheck, type AiAnalysis } from "@/lib/ai";
import { CopyButton } from "@/components/copy-button";
import { EmailGatePdf } from "@/components/email-gate-pdf";
import { ShareBar } from "@/components/share-bar";
import { ArrowRight, AlertCircle } from "lucide-react";
import Link from "next/link";
import { headers } from "next/headers";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ url?: string }>;

export async function generateMetadata({
  searchParams,
}: {
  searchParams: SearchParams;
}): Promise<Metadata> {
  const { url } = await searchParams;
  if (!url) return {};
  const ogUrl = `/api/og/report?url=${encodeURIComponent(url)}`;
  return {
    openGraph: {
      images: [{ url: ogUrl, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      images: [ogUrl],
    },
  };
}

const FALLBACK_VERDICTS: Record<ScanLabel, string> = {
  Invisible:
    "Your site is effectively invisible to AI engines. When people ask ChatGPT or Perplexity about your space, you don't come up. The good news: the biggest fixes are also the easiest.",
  "Partially Seen":
    "AI can see parts of your site, but it's missing the full picture. Fixing the top three issues would move you from partially surfaced to regularly cited.",
  Citable:
    "AI engines can find and cite your site. The foundation is solid — a few structural adds would push you into AI-native territory.",
  "AI-Native":
    "Your site is purpose-built for the AI era. AI answer engines have everything they need to surface and cite you.",
};

const LABEL_COLOR: Record<ScanLabel, string> = {
  Invisible: "#ef4444",
  "Partially Seen": "#f59e0b",
  Citable: "#a3e635",
  "AI-Native": "#84cc16",
};

export default async function ReportPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { url } = await searchParams;
  if (!url) return <MissingUrl />;

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "";
  const proto = h.get("x-forwarded-proto") ?? "https";
  const shareUrl = host
    ? `${proto}://${host}/report?url=${encodeURIComponent(url)}`
    : `/report?url=${encodeURIComponent(url)}`;

  const result = await scanSite(url);

  return (
    <div className="relative flex min-h-screen flex-col">
      <div
        aria-hidden
        className="pointer-events-none fixed left-1/2 top-[10%] -z-10 h-[500px] w-[900px] -translate-x-1/2 rounded-full opacity-[0.06] blur-[120px]"
        style={{ background: "radial-gradient(circle, #a3e635 0%, transparent 60%)" }}
      />

      <Nav />

      {result.error ? (
        <ErrorView error={result.error} rawUrl={url} />
      ) : (
        <ReportBody result={result} shareUrl={shareUrl} />
      )}

      <Footer />
    </div>
  );
}

function Nav() {
  return (
    <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-6">
      <Link href="/" className="text-base font-semibold tracking-tight">
        CITABLE.Ai
      </Link>
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-xs text-muted-2 transition-colors hover:text-foreground"
      >
        <span className="label-mono">Scan another</span>
        <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </header>
  );
}

function Footer() {
  return (
    <footer className="mx-auto w-full max-w-5xl px-6 py-8 text-xs text-muted-2">
      <div className="flex flex-col items-center justify-between gap-2 border-t border-border pt-6 sm:flex-row">
        <span>© {new Date().getFullYear()} CITABLE.Ai</span>
        <span>Built in a weekend.</span>
      </div>
    </footer>
  );
}

function MissingUrl() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center px-6 py-16 text-center">
      <AlertCircle className="h-10 w-10 text-muted-2" />
      <h1 className="mt-4 font-serif text-3xl">No URL to scan</h1>
      <p className="mt-2 text-sm text-muted">Head back and paste a site URL.</p>
      <Link
        href="/"
        className="mt-6 inline-flex items-center gap-2 rounded-lg border border-accent-deep bg-accent-deep px-5 py-3 text-sm font-semibold uppercase tracking-widest text-accent hover:bg-accent hover:text-black"
      >
        <span className="label-mono">Back to home</span>
      </Link>
    </main>
  );
}

function ErrorView({ error, rawUrl }: { error: string; rawUrl: string }) {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center px-6 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full border border-danger/30 bg-danger/10">
        <AlertCircle className="h-7 w-7 text-danger" />
      </div>
      <h1 className="mt-5 font-serif text-3xl tracking-tight">
        Couldn&apos;t scan that site
      </h1>
      <p className="mt-2 max-w-md text-sm text-muted">{error}</p>
      <p className="mt-6 text-xs text-muted-2">
        You tried:{" "}
        <code className="rounded bg-surface px-1.5 py-0.5 font-mono">
          {rawUrl}
        </code>
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex items-center gap-2 rounded-lg border border-accent-deep bg-accent-deep px-5 py-3 text-sm font-semibold uppercase tracking-widest text-accent hover:bg-accent hover:text-black"
      >
        <span className="label-mono">Try another URL</span>
      </Link>
    </main>
  );
}

function ReportBody({
  result,
  shareUrl,
}: {
  result: ScanResult;
  shareUrl: string;
}) {
  const topFixes = result.topFixIds
    .map((id) => result.checks.find((c) => c.id === id))
    .filter(Boolean) as CheckResult[];

  const hostname = safeHostname(result.normalizedUrl);
  const labelColor = LABEL_COLOR[result.label];
  const ai = result.aiAnalysis;

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 pt-4 pb-16">
      <div id="report-content">
      {/* HEADER CARD: score + verdict */}
      <section className="rounded-2xl border border-border-2 bg-surface p-6 sm:p-8">
        <div className="label-mono text-accent">◉ aeo score</div>
        <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1 text-sm text-muted-2">
          <span className="font-mono">{hostname}</span>
          {ai?.siteContext.category && (
            <>
              <span>·</span>
              <span className="font-serif">{ai.siteContext.category}</span>
            </>
          )}
        </div>

        <div className="mt-6 grid grid-cols-1 items-start gap-6 sm:grid-cols-[auto_1fr] sm:gap-10">
          <div
            className="font-serif text-[9rem] leading-none sm:text-[11rem]"
            style={{ color: labelColor }}
          >
            {result.score}
          </div>
          <div className="flex flex-col justify-center">
            <div
              className="label-mono inline-flex w-fit items-center rounded-sm px-2 py-1"
              style={{
                backgroundColor: `${labelColor}20`,
                color: labelColor,
              }}
            >
              {result.label}
            </div>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-foreground sm:text-lg">
              {ai?.verdict || FALLBACK_VERDICTS[result.label]}
            </p>
            {ai?.siteContext.oneLiner && (
              <p className="mt-3 max-w-xl text-sm text-muted-2">
                <span className="label-mono text-muted-2">About </span>
                <span className="font-serif text-muted">
                  {ai.siteContext.oneLiner}
                </span>
              </p>
            )}
          </div>
        </div>
      </section>

      {/* SHARE BAR — capture the "wow my score" moment.
          data-pdf-hide keeps these inert buttons out of the downloadable PDF. */}
      <section data-pdf-hide className="mt-6">
        <div className="label-mono text-accent">◉ share your score</div>
        <p className="mt-2 text-sm text-muted">
          Send this report to a peer. They&apos;ll want to know theirs.
        </p>
        <div className="mt-4">
          <ShareBar
            score={result.score}
            label={result.label}
            shareUrl={shareUrl}
          />
        </div>
      </section>

      {/* PLAIN-ENGLISH SUMMARY — "what this means for you" */}
      {ai?.plainSummary && (
        <section className="mt-6 rounded-2xl border border-accent/30 bg-accent/[0.04] p-6 sm:p-8">
          <div className="label-mono text-accent">
            ◉ what this means for you
          </div>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-foreground sm:text-lg">
            {ai.plainSummary}
          </p>
        </section>
      )}

      {/* CATEGORY BREAKDOWN */}
      <section className="mt-6">
        <div className="overflow-hidden rounded-2xl border border-border-2 bg-surface">
          {result.checks.map((c, i) => (
            <CategoryRow
              key={c.id}
              check={c}
              aiNote={noteForCheck(ai, c.id)}
              isLast={i === result.checks.length - 1}
            />
          ))}
        </div>
      </section>

      {/* AI QUICK WINS */}
      {ai?.quickWins && ai.quickWins.length > 0 && (
        <section className="mt-14">
          <div className="label-mono text-accent">
            ◉ quick wins — do these today
          </div>
          <div className="mt-5 space-y-3">
            {ai.quickWins.map((win, i) => (
              <PillCard
                key={i}
                tag="Quick win"
                tagClass="bg-accent/15 text-accent"
                title={win.title}
                body={win.description}
              />
            ))}
          </div>
        </section>
      )}

      {/* AI STRATEGIC FIXES */}
      {ai?.strategicFixes && ai.strategicFixes.length > 0 && (
        <section className="mt-14">
          <div className="label-mono text-warning">
            ◉ strategic fixes — structural changes
          </div>
          <div className="mt-5 space-y-3">
            {ai.strategicFixes.map((fix, i) => (
              <PillCard
                key={i}
                tag="Strategic fix"
                tagClass="bg-warning/15 text-warning"
                title={fix.title}
                body={fix.description}
              />
            ))}
          </div>
        </section>
      )}

      {/* CODE SNIPPETS from rule-based checks */}
      {topFixes.some((f) => f.fix?.code) && (
        <section className="mt-14">
          <div className="label-mono text-muted">◉ paste these on your site</div>
          <div className="mt-5 space-y-4">
            {topFixes
              .filter((f) => f.fix?.code)
              .map((c) => (
                <CodeSnippet key={c.id} check={c} />
              ))}
          </div>
        </section>
      )}

      {/* AI GENERATED FAQ */}
      {ai?.generatedFaq && ai.generatedFaq.length > 0 && (
        <GeneratedFaq ai={ai} />
      )}

      </div>{/* /#report-content */}

      {/* PDF CTA — email-gated download */}
      <section className="mt-14 rounded-2xl border border-accent/30 bg-accent/[0.04] p-8 sm:p-10 text-center">
        <h3 className="font-serif text-3xl font-normal tracking-tight sm:text-4xl">
          Take this report{" "}
          <span className="text-accent">with you.</span>
        </h3>
        <p className="mx-auto mt-3 max-w-md text-sm text-muted">
          Drop your email. We&apos;ll save the full report as a PDF — share it
          with your team or use it to pitch a client.
        </p>
        <div className="mt-6 flex justify-center">
          <EmailGatePdf
            targetSelector="#report-content"
            fileName={`citable-${hostname}`}
          />
        </div>
      </section>

      {/* CTA — competitor scan framing */}
      <section className="mt-10 rounded-2xl border border-border-2 bg-surface p-8 text-center">
        <h3 className="font-serif text-3xl font-normal tracking-tight">
          Scan a <span className="text-accent">competitor.</span>
        </h3>
        <p className="mt-2 max-w-md text-sm text-muted mx-auto">
          Run a competitor&apos;s site through CITABLE.Ai and see exactly where
          they&apos;re winning AI visibility — and where you can overtake them.
        </p>
        <Link
          href="/"
          className="mt-5 inline-flex items-center gap-2 rounded-lg border border-accent-deep bg-accent-deep px-5 py-3 text-sm font-semibold uppercase tracking-widest text-accent transition-colors hover:bg-accent hover:text-black"
        >
          <span className="label-mono">Scan a competitor</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      </section>
    </main>
  );
}

// ————————————————————————————————————————
// Category row — with optional AI note
// ————————————————————————————————————————
function CategoryRow({
  check,
  aiNote,
  isLast,
}: {
  check: CheckResult;
  aiNote?: string;
  isLast: boolean;
}) {
  const dotColor = check.passed ? "#a3e635" : "#ef4444";
  const scoreColor = check.passed ? "#a3e635" : "#ef4444";
  const displayedScore = check.passed ? check.weight : 0;
  const description = aiNote || check.summary;

  return (
    <div
      className={`flex gap-5 p-5 sm:gap-6 sm:p-6 ${!isLast ? "border-b border-border-2" : ""}`}
    >
      <div className="pt-1.5">
        <span
          className="inline-block h-2 w-2 rounded-full"
          style={{ backgroundColor: dotColor }}
        />
      </div>
      <div className="flex-1">
        <div className="label-mono text-muted-2">{check.name}</div>
        <p className="mt-2 text-sm leading-relaxed text-foreground">
          {description}
        </p>
        {!aiNote && check.evidence && (
          <p className="mt-1 text-xs text-muted-2">{check.evidence}</p>
        )}
      </div>
      <div className="self-start text-right">
        <div
          className="font-serif text-3xl leading-none tabular-nums"
          style={{ color: scoreColor }}
        >
          {displayedScore}
        </div>
        <div className="label-mono mt-1 text-muted-2">/ {check.weight}</div>
      </div>
    </div>
  );
}

// ————————————————————————————————————————
// Pill card for quick wins / strategic fixes
// ————————————————————————————————————————
function PillCard({
  tag,
  tagClass,
  title,
  body,
}: {
  tag: string;
  tagClass: string;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-xl border border-border-2 bg-surface p-5 sm:p-6">
      <div
        className={`inline-flex items-center rounded-sm px-2 py-1 ${tagClass}`}
      >
        <span className="label-mono">{tag}</span>
      </div>
      <h3 className="mt-3 text-base font-semibold">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted">{body}</p>
    </div>
  );
}

// ————————————————————————————————————————
// Code snippet card
// ————————————————————————————————————————
function CodeSnippet({ check }: { check: CheckResult }) {
  if (!check.fix?.code) return null;
  return (
    <div className="overflow-hidden rounded-xl border border-border-2 bg-surface">
      <div className="flex items-start justify-between gap-4 p-5 sm:p-6">
        <div>
          <div className="label-mono text-muted-2">{check.name}</div>
          <h4 className="mt-1 text-sm font-semibold">{check.fix.headline}</h4>
        </div>
      </div>
      <div className="relative border-t border-border-2 bg-background">
        <div className="absolute right-3 top-3">
          <CopyButton text={check.fix.code} />
        </div>
        <pre className="overflow-x-auto p-4 pr-20 font-mono text-[12.5px] leading-relaxed text-foreground">
          <code>{check.fix.code}</code>
        </pre>
      </div>
    </div>
  );
}

// ————————————————————————————————————————
// Generated FAQ — italic serif questions, copyable JSON-LD block
// ————————————————————————————————————————
function GeneratedFaq({ ai }: { ai: AiAnalysis }) {
  // Build a FAQPage JSON-LD block from the generated Q&A
  const faqJsonLd = JSON.stringify(
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: ai.generatedFaq.map((f) => ({
        "@type": "Question",
        name: f.question,
        acceptedAnswer: { "@type": "Answer", text: f.answer },
      })),
    },
    null,
    2,
  );
  const pastable = `<script type="application/ld+json">\n${faqJsonLd}\n</script>`;

  return (
    <section className="mt-14">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="label-mono text-accent">
          ◉ generated FAQ — paste this onto your site
        </div>
        <CopyButton text={pastable} label="Copy schema" />
      </div>
      <div className="mt-5 overflow-hidden rounded-2xl border border-border-2 bg-surface">
        <ul className="divide-y divide-border-2">
          {ai.generatedFaq.map((f, i) => (
            <li key={i} className="p-5 sm:p-6">
              <h4 className="font-serif text-lg font-medium text-foreground">
                {f.question}
              </h4>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                {f.answer}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function safeHostname(urlStr: string): string {
  try {
    return new URL(urlStr).hostname.replace(/^www\./, "");
  } catch {
    return urlStr;
  }
}
