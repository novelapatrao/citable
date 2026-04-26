import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";
import { scanSite, type ScanLabel } from "@/lib/scan";

const SIZE = { width: 1200, height: 630 };

const LABEL_COLOR: Record<ScanLabel, string> = {
  Invisible: "#ef4444",
  "Partially Seen": "#f59e0b",
  Citable: "#a3e635",
  "AI-Native": "#84cc16",
};

const LABEL_GLOW_RGBA: Record<ScanLabel, string> = {
  Invisible: "rgba(239, 68, 68, 0.18)",
  "Partially Seen": "rgba(245, 176, 75, 0.18)",
  Citable: "rgba(163, 230, 53, 0.20)",
  "AI-Native": "rgba(132, 204, 22, 0.22)",
};

function safeHostname(rawUrl: string): string {
  try {
    const u = new URL(rawUrl.startsWith("http") ? rawUrl : `https://${rawUrl}`);
    return u.hostname.replace(/^www\./, "");
  } catch {
    return rawUrl.replace(/^https?:\/\//, "").replace(/^www\./, "").slice(0, 60);
  }
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");

  if (!url) {
    return new Response("missing 'url' query param", { status: 400 });
  }

  const result = await scanSite(url, { aiOff: true });

  // ————— failure → branded fallback image, NOT a 500 —————
  if (result.error || result.checks.length === 0) {
    return new ImageResponse(
      (
        <FallbackImage
          hostname={safeHostname(url)}
          message={result.error ?? "Couldn't scan that site."}
        />
      ),
      { ...SIZE },
    );
  }

  const passedCount = result.checks.filter((c) => c.passed).length;

  return new ImageResponse(
    (
      <ResultImage
        hostname={safeHostname(result.normalizedUrl)}
        score={result.score}
        label={result.label}
        passedCount={passedCount}
        totalChecks={result.checks.length}
      />
    ),
    { ...SIZE },
  );
}

// ————————————————————————————————————————
// Result image — score + label + hostname
// ————————————————————————————————————————
function ResultImage({
  hostname,
  score,
  label,
  passedCount,
  totalChecks,
}: {
  hostname: string;
  score: number;
  label: ScanLabel;
  passedCount: number;
  totalChecks: number;
}) {
  const scoreColor = LABEL_COLOR[label];
  const glowColor = LABEL_GLOW_RGBA[label];

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "60px 72px",
        background: "#0e0e0b",
        color: "#f6f5ef",
        fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif",
        position: "relative",
      }}
    >
      {/* score-color glow behind the big number */}
      <div
        style={{
          position: "absolute",
          top: 90,
          right: -120,
          width: 720,
          height: 720,
          background: `radial-gradient(circle, ${glowColor} 0%, transparent 60%)`,
          display: "flex",
        }}
      />

      {/* TOP ROW — brand left, "AEO score" pill right */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div
          style={{
            fontSize: 22,
            fontWeight: 600,
            letterSpacing: "-0.01em",
            display: "flex",
          }}
        >
          CITABLE.Ai
        </div>
        <div
          style={{
            fontSize: 14,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "#d4f26b",
            fontFamily: "ui-monospace, monospace",
            display: "flex",
          }}
        >
          aeo score
        </div>
      </div>

      {/* CENTER — score on left, hostname + label on right */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 64,
          marginTop: 24,
        }}
      >
        <div
          style={{
            fontSize: 320,
            lineHeight: 0.9,
            fontFamily: "Georgia, serif",
            color: scoreColor,
            letterSpacing: "-0.04em",
            display: "flex",
            minWidth: 320,
          }}
        >
          {score}
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 18,
            flex: 1,
          }}
        >
          <div
            style={{
              fontSize: 18,
              fontFamily: "ui-monospace, monospace",
              color: "#6d6d62",
              letterSpacing: "0.04em",
              display: "flex",
            }}
          >
            {hostname}
          </div>
          <div
            style={{
              padding: "8px 16px",
              background: `${scoreColor}26`,
              color: scoreColor,
              fontSize: 22,
              fontFamily: "ui-monospace, monospace",
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              borderRadius: 6,
              display: "flex",
              alignSelf: "flex-start",
            }}
          >
            {label}
          </div>
          <div
            style={{
              fontSize: 28,
              lineHeight: 1.35,
              color: "#a3a398",
              fontFamily: "Georgia, serif",
              maxWidth: 560,
              display: "flex",
            }}
          >
            {passedCount} of {totalChecks} AEO checks passed.
          </div>
        </div>
      </div>

      {/* BOTTOM ROW — tagline left, CTA right */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div
          style={{
            fontSize: 16,
            color: "#6d6d62",
            fontFamily: "ui-monospace, monospace",
            letterSpacing: "0.04em",
            display: "flex",
          }}
        >
          chatgpt · claude · perplexity · google ai overviews
        </div>
        <div
          style={{
            padding: "12px 22px",
            background: "#d4f26b",
            color: "#0e0e0b",
            fontSize: 16,
            fontWeight: 700,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            borderRadius: 10,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          Scan your site →
        </div>
      </div>
    </div>
  );
}

// ————————————————————————————————————————
// Fallback image — when the scan fails (bad URL, unreachable, etc)
// ————————————————————————————————————————
function FallbackImage({
  hostname,
  message,
}: {
  hostname: string;
  message: string;
}) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "60px 72px",
        background: "#0e0e0b",
        color: "#f6f5ef",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      <div
        style={{
          fontSize: 22,
          fontWeight: 600,
          display: "flex",
        }}
      >
        CITABLE.Ai
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 24,
        }}
      >
        <div
          style={{
            fontSize: 16,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "#ef4444",
            fontFamily: "ui-monospace, monospace",
            display: "flex",
          }}
        >
          scan failed
        </div>
        <div
          style={{
            fontSize: 64,
            fontFamily: "Georgia, serif",
            lineHeight: 1.1,
            letterSpacing: "-0.025em",
            display: "flex",
          }}
        >
          {hostname}
        </div>
        <div
          style={{
            fontSize: 24,
            color: "#a3a398",
            maxWidth: 800,
            display: "flex",
          }}
        >
          {message}
        </div>
      </div>

      <div
        style={{
          padding: "12px 22px",
          background: "#d4f26b",
          color: "#0e0e0b",
          fontSize: 16,
          fontWeight: 700,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          borderRadius: 10,
          display: "flex",
          alignItems: "center",
          gap: 10,
          alignSelf: "flex-end",
        }}
      >
        Scan a different site →
      </div>
    </div>
  );
}
