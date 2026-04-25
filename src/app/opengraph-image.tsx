import { ImageResponse } from "next/og";

export const alt = "CITABLE.Ai — Is your site AI-ready?";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px",
          background: "#0e0e0b",
          color: "#f6f5ef",
          fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif",
          position: "relative",
        }}
      >
        {/* faint accent glow top-right */}
        <div
          style={{
            position: "absolute",
            top: -200,
            right: -200,
            width: 700,
            height: 700,
            background:
              "radial-gradient(circle, rgba(212, 242, 107, 0.18) 0%, transparent 60%)",
            display: "flex",
          }}
        />

        {/* Brand mark top-left */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            fontSize: 22,
            fontWeight: 600,
            letterSpacing: "-0.01em",
            color: "#f6f5ef",
          }}
        >
          CITABLE.Ai
        </div>

        {/* Headline */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 24,
            maxWidth: 920,
          }}
        >
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
            ◉ free aeo scanner
          </div>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              fontSize: 88,
              lineHeight: 1.05,
              fontFamily: "Georgia, serif",
              letterSpacing: "-0.025em",
              color: "#f6f5ef",
            }}
          >
            <span>Is your site&nbsp;</span>
            <span style={{ color: "#d4f26b" }}>AI-ready?</span>
          </div>
          <div
            style={{
              fontSize: 26,
              lineHeight: 1.4,
              color: "#a3a398",
              maxWidth: 820,
              display: "flex",
            }}
          >
            Paste a URL → score how well ChatGPT, Claude, and Perplexity
            find and cite your site. 7 checks. Plain-English fixes. ~under
            a minute.
          </div>
        </div>

        {/* Footer row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{
              fontSize: 18,
              color: "#6d6d62",
              fontFamily: "ui-monospace, monospace",
              letterSpacing: "0.04em",
              display: "flex",
            }}
          >
            free · no signup · powered by claude
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
    ),
    { ...size },
  );
}
