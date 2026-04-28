"use client";

import { Check, Link2 } from "lucide-react";
import { useState } from "react";

type ShareBarProps = {
  score: number;
  label: string;
  shareUrl: string;
};

export function ShareBar({ score, label, shareUrl }: ShareBarProps) {
  const [copied, setCopied] = useState(false);

  const tweetText = `My site scored ${score}/100 on CITABLE.Ai — that's "${label}" for ChatGPT, Claude & Perplexity. What's yours?`;

  const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
    shareUrl,
  )}`;
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
    tweetText,
  )}&url=${encodeURIComponent(shareUrl)}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard failed — silent
    }
  };

  const buttonClass =
    "inline-flex items-center gap-2 rounded-lg border border-border-2 bg-surface px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:border-accent/40 hover:text-accent";

  return (
    <div className="flex flex-wrap gap-3">
      <a
        href={linkedInUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={buttonClass}
        aria-label="Share on LinkedIn"
      >
        <LinkedInGlyph />
        <span>LinkedIn</span>
      </a>

      <a
        href={twitterUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={buttonClass}
        aria-label="Share on X (Twitter)"
      >
        <XGlyph />
        <span>Post on X</span>
      </a>

      <button
        type="button"
        onClick={handleCopy}
        className={buttonClass}
        aria-label="Copy link to report"
      >
        {copied ? (
          <>
            <Check className="h-4 w-4 text-accent" />
            <span>Copied!</span>
          </>
        ) : (
          <>
            <Link2 className="h-4 w-4" />
            <span>Copy link</span>
          </>
        )}
      </button>
    </div>
  );
}

// Brand glyphs — lucide doesn't ship Twitter/LinkedIn icons.
function LinkedInGlyph() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="currentColor"
      aria-hidden
    >
      <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.13 1.45-2.13 2.94v5.67H9.36V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.11 2.06 2.06 0 0 1 0 4.11zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.2 0 22.22 0z" />
    </svg>
  );
}

function XGlyph() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="14"
      height="14"
      fill="currentColor"
      aria-hidden
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}
