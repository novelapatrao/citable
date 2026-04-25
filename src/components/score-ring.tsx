"use client";

import { motion } from "framer-motion";
import type { ScanLabel } from "@/lib/scan";

const LABEL_COLORS: Record<ScanLabel, { ring: string; text: string; bg: string }> = {
  Invisible: { ring: "#ef4444", text: "#b91c1c", bg: "#fee2e2" },
  "Partially Seen": { ring: "#f59e0b", text: "#b45309", bg: "#fef3c7" },
  Citable: { ring: "#84cc16", text: "#4d7c0f", bg: "#ecfccb" },
  "AI-Native": { ring: "#a3e635", text: "#365314", bg: "#d9f99d" },
};

export function ScoreRing({
  score,
  label,
}: {
  score: number;
  label: ScanLabel;
}) {
  const colors = LABEL_COLORS[label];
  const radius = 92;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative flex flex-col items-center">
      <div className="relative h-56 w-56">
        <svg className="h-full w-full -rotate-90" viewBox="0 0 200 200">
          <circle
            cx="100"
            cy="100"
            r={radius}
            fill="none"
            stroke="#e4e4e7"
            strokeWidth="10"
          />
          <motion.circle
            cx="100"
            cy="100"
            r={radius}
            fill="none"
            stroke={colors.ring}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.4, ease: "easeOut", delay: 0.2 }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.6, ease: "easeOut" }}
            className="text-6xl font-semibold tracking-tight tabular-nums"
          >
            {score}
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.9 }}
            className="text-sm text-muted"
          >
            out of 100
          </motion.div>
        </div>
      </div>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 1.1 }}
        className="mt-5 inline-flex items-center rounded-full px-4 py-1.5 text-sm font-semibold"
        style={{ backgroundColor: colors.bg, color: colors.text }}
      >
        {label}
      </motion.div>
    </div>
  );
}
