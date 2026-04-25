"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

export function CopyButton({
  text,
  label = "Copy",
}: {
  text: string;
  label?: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // clipboard failed — silent
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex items-center gap-1.5 rounded-md border border-border-2 bg-surface px-2.5 py-1 text-[11px] font-medium uppercase tracking-widest text-muted-2 transition-colors hover:border-accent/40 hover:text-foreground"
      style={{ fontFamily: "var(--font-geist-mono)" }}
    >
      {copied ? (
        <>
          <Check className="h-3 w-3 text-accent" />
          Copied
        </>
      ) : (
        <>
          <Copy className="h-3 w-3" />
          {label}
        </>
      )}
    </button>
  );
}
