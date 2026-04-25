"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import {
  ArrowRight,
  Bot,
  Code2,
  FileText,
  Eye,
  List,
  Tag,
  MessageCircle,
} from "lucide-react";

const HEADLINE_WORDS = ["Is", "your", "site"];
const ACCENT_WORD = "AI-ready?";

export default function Home() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [scanLine, setScanLine] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setScanLine(false), 4200);
    return () => clearTimeout(t);
  }, []);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    let normalized = url.trim();
    if (!/^https?:\/\//i.test(normalized)) {
      normalized = "https://" + normalized;
    }
    setLoading(true);
    router.push(`/report?url=${encodeURIComponent(normalized)}`);
  };

  return (
    <div className="relative flex min-h-screen flex-col">
      {scanLine && <span aria-hidden className="scan-line" />}

      <div
        aria-hidden
        className="pointer-events-none fixed left-1/2 top-[20%] -z-10 h-[500px] w-[900px] -translate-x-1/2 rounded-full opacity-[0.10] blur-[120px]"
        style={{ background: "radial-gradient(circle, #d4f26b 0%, transparent 60%)" }}
      />

      <Nav />

      <main className="mx-auto w-full max-w-5xl flex-1 px-6 pb-24 pt-8 sm:pt-16">
        {/* HERO */}
        <section className="max-w-3xl">
          <h1 className="font-serif text-5xl font-normal leading-[1.05] tracking-tight sm:text-7xl">
            <WordsReveal words={HEADLINE_WORDS} delayStart={0.4} />{" "}
            <AccentReveal word={ACCENT_WORD} delayStart={1.0} />
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.6 }}
            className="mt-8 max-w-xl text-base text-muted sm:text-lg"
          >
            Paste your URL. We analyse your content against 7 AEO criteria
            and score how well AI engines — ChatGPT, Perplexity, Google AI
            Overviews — will surface your brand.
          </motion.p>

          <motion.form
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.9 }}
            onSubmit={handleSubmit}
            className="mt-10 flex w-full max-w-2xl items-stretch overflow-hidden rounded-lg border border-border-2 bg-surface focus-within:border-accent/50 focus-within:ring-4 focus-within:ring-accent/10"
          >
            <div className="hidden items-center border-r border-border-2 bg-surface-2 px-4 text-sm text-muted-2 sm:flex">
              <span className="label-mono">https://</span>
            </div>
            <input
              type="text"
              inputMode="url"
              autoComplete="url"
              placeholder="yourwebsite.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={loading}
              className="min-w-0 flex-1 bg-transparent px-4 py-4 text-base font-medium text-foreground placeholder:text-muted-2 focus:outline-none disabled:opacity-60"
              required
            />
            <button
              type="submit"
              disabled={loading || !url.trim()}
              className="group inline-flex items-center justify-center gap-2 whitespace-nowrap bg-accent px-5 text-sm font-semibold uppercase tracking-widest text-background transition-colors hover:bg-accent-hover disabled:opacity-60"
            >
              {loading ? (
                <>
                  <span className="h-3 w-3 animate-spin rounded-full border-[1.5px] border-background/40 border-t-background" />
                  <span className="label-mono">Analysing</span>
                </>
              ) : (
                <>
                  <span className="label-mono">Analyse</span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </button>
          </motion.form>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 2.2 }}
            className="mt-4 text-xs text-muted-2"
          >
            Free · No signup · ~20 seconds
          </motion.p>
        </section>

        {/* STATS STRIP */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.6 }}
          className="mt-28 grid grid-cols-1 overflow-hidden rounded-xl border border-border-2 sm:grid-cols-3"
        >
          {[
            {
              n: "70%",
              label: "of B2B buyers use AI to research before talking to sales",
            },
            {
              n: "6×",
              label: "more AI citations when structured data is present",
            },
            {
              n: "<20s",
              label: "to scan your full site and get real fixes",
            },
          ].map((s, i) => (
            <div
              key={s.n}
              className={`p-6 ${i > 0 ? "border-t border-border-2 sm:border-l sm:border-t-0" : ""}`}
            >
              <div className="font-serif text-5xl text-accent">{s.n}</div>
              <div className="mt-3 max-w-[220px] text-sm text-muted">
                {s.label}
              </div>
            </div>
          ))}
        </motion.section>

        {/* WHAT WE CHECK */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6 }}
          className="mt-28"
        >
          <div className="label-mono text-muted">◉ what we check</div>
          <h2 className="mt-4 max-w-2xl font-serif text-4xl font-normal leading-[1.1] tracking-tight sm:text-5xl">
            7 signals. <span className="text-accent">Real fixes.</span>
          </h2>
          <p className="mt-4 max-w-xl text-base text-muted">
            Every check is run against the live HTML of your site. No
            guesswork. No generic advice.
          </p>

          <div className="mt-10 grid grid-cols-1 overflow-hidden rounded-xl border border-border-2 sm:grid-cols-2">
            {CHECKS.map((c, i) => {
              const isFirstCol = i % 2 === 0;
              const needsTop = i >= (isFirstCol ? 2 : 1) || (!isFirstCol && i >= 1);
              // simpler: border-top for any item after the first row, border-left for right column
              return (
                <div
                  key={c.title}
                  className={`group bg-background p-5 transition-colors hover:bg-surface
                    ${i >= 2 ? "sm:border-t sm:border-border-2" : ""}
                    ${i > 0 ? "border-t border-border-2 sm:border-t-0" : ""}
                    ${i >= 2 ? "border-t border-border-2" : ""}
                    ${!isFirstCol ? "sm:border-l sm:border-border-2" : ""}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-md border border-border-2 bg-background text-muted group-hover:border-accent/50 group-hover:text-accent">
                      {c.icon}
                    </span>
                    <h3 className="text-sm font-semibold tracking-tight">
                      {c.title}
                    </h3>
                  </div>
                  <p className="mt-3 text-sm text-muted">{c.desc}</p>
                </div>
              );
            })}
          </div>
        </motion.section>

        {/* WHO IT'S FOR */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6 }}
          className="mt-28"
        >
          <div className="label-mono text-muted">◉ who it&apos;s for</div>
          <h2 className="mt-4 max-w-2xl font-serif text-4xl font-normal leading-[1.1] tracking-tight sm:text-5xl">
            Built for founders and the{" "}
            <span className="text-accent">marketers who sell to them.</span>
          </h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            <PersonaCard
              title="Founders"
              pain="Your customers ask ChatGPT about your space — and your competitor comes up, not you."
              gain="See exactly why. Get 3 fixes you can ship before tomorrow's demo."
            />
            <PersonaCard
              title="Marketers & consultants"
              pain="Clients want to know why they're not showing up in AI answers — and they want proof."
              gain="Paste the URL. Share the report. Use it to sell the work."
            />
          </div>
        </motion.section>

        {/* FAQ */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6 }}
          className="mt-28"
        >
          <div className="label-mono text-muted">◉ common questions</div>
          <h2 className="mt-4 max-w-2xl font-serif text-4xl font-normal leading-[1.1] tracking-tight sm:text-5xl">
            Questions we <span className="text-accent">actually get.</span>
          </h2>
          <div className="mt-10 space-y-3">
            {FAQ.map((f, i) => (
              <FaqItem key={i} q={f.q} a={f.a} />
            ))}
          </div>
        </motion.section>

        {/* FINAL CTA */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.6 }}
          className="mt-28 rounded-2xl border border-border-2 bg-surface p-8 sm:p-12"
        >
          <h2 className="max-w-2xl font-serif text-4xl font-normal leading-[1.1] tracking-tight sm:text-5xl">
            Find out if you&apos;re{" "}
            <span className="text-accent">getting cited.</span>
          </h2>
          <p className="mt-4 max-w-xl text-muted">
            It&apos;s free. No signup. Takes twenty seconds.
          </p>
          <form
            onSubmit={handleSubmit}
            className="mt-8 flex w-full max-w-2xl items-stretch overflow-hidden rounded-lg border border-border-2 bg-background focus-within:border-accent/50"
          >
            <div className="hidden items-center border-r border-border-2 bg-surface px-4 text-sm text-muted-2 sm:flex">
              <span className="label-mono">https://</span>
            </div>
            <input
              type="text"
              inputMode="url"
              placeholder="yourwebsite.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={loading}
              className="min-w-0 flex-1 bg-transparent px-4 py-4 text-base font-medium text-foreground placeholder:text-muted-2 focus:outline-none disabled:opacity-60"
              required
            />
            <button
              type="submit"
              disabled={loading || !url.trim()}
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap bg-accent px-5 text-sm font-semibold uppercase tracking-widest text-background transition-colors hover:bg-accent-hover disabled:opacity-60"
            >
              <span className="label-mono">
                {loading ? "Analysing" : "Analyse"}
              </span>
            </button>
          </form>
        </motion.section>
      </main>

      <Footer />
    </div>
  );
}

// ————————————————————————————————————————
// Hero headline — word-by-word reveal
// ————————————————————————————————————————
function WordsReveal({
  words,
  delayStart,
}: {
  words: string[];
  delayStart: number;
}) {
  return (
    <>
      {words.map((word, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.6,
            delay: delayStart + i * 0.12,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="inline-block"
        >
          {word}
          {i < words.length - 1 && " "}
        </motion.span>
      ))}
    </>
  );
}

// ————————————————————————————————————————
// Lime accent word — typewriter + underline draw
// ————————————————————————————————————————
function AccentReveal({
  word,
  delayStart,
}: {
  word: string;
  delayStart: number;
}) {
  const [typed, setTyped] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    const start = setTimeout(() => {
      let i = 0;
      const interval = setInterval(() => {
        i++;
        setTyped(word.slice(0, i));
        if (i >= word.length) {
          clearInterval(interval);
          setTimeout(() => setDone(true), 400);
        }
      }, 70);
      return () => clearInterval(interval);
    }, delayStart * 1000);
    return () => clearTimeout(start);
  }, [word, delayStart]);

  return (
    <span className="relative inline-block text-accent">
      {typed || " "}
      {!done && (
        <span className="cursor-blink ml-0.5 inline-block h-[0.7em] w-[2px] -translate-y-[-0.05em] bg-accent align-middle" />
      )}
      {done && (
        <motion.span
          aria-hidden
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="absolute -bottom-1 left-0 h-[3px] w-full origin-left bg-accent"
        />
      )}
    </span>
  );
}

function Nav() {
  return (
    <header className="relative z-10 mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-6">
      <span className="text-base font-semibold tracking-tight">Citable</span>
      <div className="hidden text-xs text-muted-2 sm:block">
        Free while in beta
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="mx-auto w-full max-w-5xl px-6 py-8 text-xs text-muted-2">
      <div className="flex flex-col items-center justify-between gap-2 border-t border-border pt-6 sm:flex-row">
        <span>© {new Date().getFullYear()} Citable</span>
        <span>Built in a weekend.</span>
      </div>
    </footer>
  );
}

function PersonaCard({
  title,
  pain,
  gain,
}: {
  title: string;
  pain: string;
  gain: string;
}) {
  return (
    <div className="rounded-2xl border border-border-2 bg-surface p-6">
      <div className="label-mono text-accent">◉ {title}</div>
      <p className="mt-4 text-base text-foreground">{pain}</p>
      <div className="mt-6 border-t border-border-2 pt-4">
        <div className="label-mono text-muted-2">what you get</div>
        <p className="mt-2 text-sm text-muted">{gain}</p>
      </div>
    </div>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <button
      type="button"
      onClick={() => setOpen((v) => !v)}
      className="group w-full rounded-xl border border-border-2 bg-surface px-5 py-4 text-left transition-colors hover:border-accent/40"
    >
      <div className="flex items-center justify-between gap-4">
        <span className="font-serif text-lg">{q}</span>
        <span
          className={`label-mono shrink-0 text-muted-2 transition-transform ${
            open ? "rotate-45" : ""
          }`}
        >
          +
        </span>
      </div>
      {open && (
        <motion.p
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="mt-3 text-sm text-muted"
        >
          {a}
        </motion.p>
      )}
    </button>
  );
}

const CHECKS = [
  {
    icon: <Bot className="h-4 w-4" />,
    title: "AI crawler access",
    desc: "Do ChatGPT, Claude, and Perplexity's crawlers have permission to read your site? If you blocked them in robots.txt, you're invisible.",
  },
  {
    icon: <Code2 className="h-4 w-4" />,
    title: "Structured data (schema.org)",
    desc: "Do you have JSON-LD tags that tell AI what kind of page this is? Structured data is the #1 lever for getting cited.",
  },
  {
    icon: <FileText className="h-4 w-4" />,
    title: "llms.txt file",
    desc: "The new standard for guiding AI through your site. A sitemap for language models.",
  },
  {
    icon: <Eye className="h-4 w-4" />,
    title: "Content without JavaScript",
    desc: "Many AI crawlers can't execute JS. If your content only loads after JS runs, they see an empty shell.",
  },
  {
    icon: <List className="h-4 w-4" />,
    title: "Heading structure",
    desc: "One clear H1, logical H2s. AI uses headings like a table of contents — if yours is broken, so is its understanding.",
  },
  {
    icon: <Tag className="h-4 w-4" />,
    title: "Meta title & description",
    desc: "AI reads your title and description before it reads the body. Make them specific, descriptive, and the right length.",
  },
  {
    icon: <MessageCircle className="h-4 w-4" />,
    title: "FAQ & Q&A content",
    desc: "AI cites direct Q&A pages 3–5× more often. If you don't have FAQPage schema, you're missing the biggest citation surface.",
  },
];

const FAQ = [
  {
    q: "Is it really free?",
    a: "Yes. Free while in beta. No card, no signup. We may introduce a paid tier later for deep audits and scheduled rescans — the basic 7-signal audit will stay free.",
  },
  {
    q: "What does AEO mean?",
    a: "Answer Engine Optimization — making your site legible to AI answer engines like ChatGPT, Claude, Perplexity, and Google AI Overviews. Think of it as SEO for the AI era.",
  },
  {
    q: "How is this different from regular SEO?",
    a: "SEO optimizes for search result rankings. AEO optimizes for being cited inside AI-generated answers. Different signals, different crawlers, different wins. Both matter.",
  },
  {
    q: "Do you store my data?",
    a: "We fetch your site's public HTML (the same thing Google sees) and analyze it. We don't store the page content. If you give us your email for a PDF report, we keep that — nothing else.",
  },
  {
    q: "What kind of sites can I scan?",
    a: "Any public URL. Works great for SaaS homepages, DTC brands, docs, landing pages, and blogs. Pages behind logins won't work — we can't see them, and neither can AI.",
  },
];
