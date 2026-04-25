"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

const STEPS = [
  "Fetching site content",
  "Parsing HTML and scripts",
  "Checking robots.txt for AI crawlers",
  "Scanning for schema and structured data",
  "Evaluating heading and meta structure",
  "Running AEO rubric across 7 criteria",
  "Asking Claude to analyse your brand",
  "Generating quick wins and FAQ",
];

export default function Loading() {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const t = setInterval(() => {
      setActiveIndex((i) => Math.min(i + 1, STEPS.length));
    }, 7500);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="relative flex min-h-screen flex-col">
      <span aria-hidden className="scan-line" />

      <div
        aria-hidden
        className="pointer-events-none fixed left-1/2 top-[20%] -z-10 h-[500px] w-[900px] -translate-x-1/2 rounded-full opacity-[0.08] blur-[120px]"
        style={{ background: "radial-gradient(circle, #a3e635 0%, transparent 60%)" }}
      />

      {/* nav */}
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-6">
        <span className="text-base font-semibold tracking-tight">CITABLE.Ai</span>
        <div className="hidden text-xs text-muted-2 sm:block">Analysing…</div>
      </header>

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-6 pb-24">
        <div className="label-mono text-accent">◉ analysing</div>
        <h2 className="mt-4 font-serif text-4xl font-normal leading-[1.1] tracking-tight sm:text-6xl">
          Reading your site like{" "}
          <span className="text-accent">an AI would.</span>
        </h2>
        <p className="mt-5 max-w-xl text-muted">
          Takes about 30 seconds. Running 7 AEO checks plus a Claude
          analysis tuned to your site.
        </p>

        <ul className="mt-10 space-y-3">
          {STEPS.map((step, i) => {
            const state =
              i < activeIndex ? "done" : i === activeIndex ? "active" : "pending";
            return (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                className="flex items-center gap-3 text-sm"
              >
                <Dot state={state} />
                <span
                  className={
                    state === "pending"
                      ? "text-muted-2"
                      : state === "active"
                      ? "text-foreground"
                      : "text-muted"
                  }
                >
                  {step}
                </span>
              </motion.li>
            );
          })}
        </ul>
      </main>
    </div>
  );
}

function Dot({ state }: { state: "done" | "active" | "pending" }) {
  if (state === "done") {
    return <span className="h-2 w-2 rounded-full bg-accent" />;
  }
  if (state === "active") {
    return (
      <span className="relative flex h-2 w-2 items-center justify-center">
        <span className="absolute h-4 w-4 animate-ping rounded-full bg-accent/50" />
        <span className="relative h-2 w-2 rounded-full bg-accent" />
      </span>
    );
  }
  return <span className="h-2 w-2 rounded-full border border-border-2" />;
}
