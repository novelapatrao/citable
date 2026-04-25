import type { Metadata } from "next";
import { Geist, Geist_Mono, Fraunces } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  style: ["normal"],
  axes: ["SOFT", "opsz"],
});

export const metadata: Metadata = {
  title: "Citable — Is your site AI-ready?",
  description:
    "Paste your URL. We analyze your content against 7 AEO criteria and score how well AI engines — ChatGPT, Perplexity, Google AI Overviews — will surface your brand.",
  openGraph: {
    title: "Citable — Is your site AI-ready?",
    description:
      "Paste your URL. We analyze your content against 7 AEO criteria and score how well AI engines will surface your brand.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Citable — Is your site AI-ready?",
    description:
      "Paste your URL. Score how well AI engines will surface your brand.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable}`}
    >
      <body className="min-h-screen bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
