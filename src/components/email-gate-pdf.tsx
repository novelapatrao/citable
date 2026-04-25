"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Download, X, Mail, CheckCircle2 } from "lucide-react";
import { useState, type FormEvent } from "react";

const FORM_ID =
  "1FAIpQLSd6J5191kU6u8E6aYcEOR1hVcXPnncUAu9a3DmoRfYWQoAYsQ";
const EMAIL_ENTRY = "entry.673619599";
const FORM_URL = `https://docs.google.com/forms/d/e/${FORM_ID}/formResponse`;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type State = "idle" | "submitting" | "success" | "error";

export function EmailGatePdf({
  targetSelector,
  fileName,
}: {
  targetSelector: string;
  fileName: string;
}) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [state, setState] = useState<State>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const close = () => {
    setOpen(false);
    setTimeout(() => {
      setState("idle");
      setEmail("");
      setErrorMsg("");
    }, 250);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!EMAIL_RE.test(email.trim())) {
      setErrorMsg("That doesn't look like a valid email.");
      return;
    }
    setErrorMsg("");
    setState("submitting");

    // 1. Fire-and-forget POST to Google Form (no-cors hides response, that's fine).
    try {
      await fetch(FORM_URL, {
        method: "POST",
        mode: "no-cors",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({ [EMAIL_ENTRY]: email.trim() }).toString(),
      });
    } catch {
      // Silent — no-cors won't surface real errors anyway.
    }

    // 2. Generate PDF from the rendered report.
    try {
      const target = document.querySelector(targetSelector) as HTMLElement | null;
      if (!target) throw new Error("Couldn't find report content on page.");

      // Dynamic import — html2pdf.js touches window and must be client-only.
      const mod = await import("html2pdf.js");
      const html2pdf = (mod.default ?? mod) as (typeof import("html2pdf.js"))["default"];

      await html2pdf()
        .set({
          margin: [10, 10, 10, 10],
          filename: fileName,
          image: { type: "jpeg", quality: 0.95 },
          html2canvas: {
            scale: 2,
            backgroundColor: "#0e0e0b",
            useCORS: true,
            logging: false,
          },
          jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        })
        .from(target)
        .save();

      setState("success");
    } catch (err) {
      setState("error");
      setErrorMsg(
        err instanceof Error
          ? err.message
          : "Something went wrong generating the PDF.",
      );
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center justify-center gap-2 rounded-lg bg-accent px-6 py-3 text-sm font-semibold uppercase tracking-widest text-background transition-colors hover:bg-accent-hover"
      >
        <Download className="h-4 w-4" />
        <span className="label-mono">Get this as a PDF</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
            onClick={close}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-md rounded-2xl border border-border-2 bg-surface p-7 shadow-2xl"
            >
              <button
                type="button"
                onClick={close}
                aria-label="Close"
                className="absolute right-4 top-4 text-muted-2 transition-colors hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>

              {state === "success" ? (
                <div className="flex flex-col items-center text-center">
                  <CheckCircle2 className="h-10 w-10 text-accent" />
                  <h3 className="mt-4 font-serif text-2xl">PDF on its way</h3>
                  <p className="mt-2 max-w-sm text-sm text-muted">
                    Check your downloads. We saved your email so we can send
                    new features as we ship them — unsubscribe anytime.
                  </p>
                  <button
                    type="button"
                    onClick={close}
                    className="mt-6 inline-flex items-center justify-center rounded-lg border border-border-2 bg-background px-5 py-2.5 text-xs font-semibold uppercase tracking-widest text-foreground transition-colors hover:border-accent/50"
                  >
                    Close
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  <div className="flex h-10 w-10 items-center justify-center rounded-md border border-accent/40 bg-accent/10">
                    <Mail className="h-5 w-5 text-accent" />
                  </div>
                  <h3 className="mt-5 font-serif text-2xl leading-tight tracking-tight">
                    Get the full report as a PDF.
                  </h3>
                  <p className="mt-2 text-sm text-muted">
                    Drop your email — we&apos;ll save the report and ping you
                    when we ship the deeper audit.
                  </p>

                  <label className="mt-6 block">
                    <span className="label-mono text-muted-2">your email</span>
                    <input
                      type="email"
                      autoComplete="email"
                      required
                      autoFocus
                      placeholder="you@yourcompany.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={state === "submitting"}
                      className="mt-2 block w-full rounded-lg border border-border-2 bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-2 focus:border-accent/50 focus:outline-none focus:ring-4 focus:ring-accent/10 disabled:opacity-60"
                    />
                  </label>

                  {errorMsg && (
                    <p className="mt-3 text-xs text-danger">{errorMsg}</p>
                  )}

                  <button
                    type="submit"
                    disabled={state === "submitting"}
                    className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-5 py-3 text-sm font-semibold uppercase tracking-widest text-background transition-colors hover:bg-accent-hover disabled:opacity-60"
                  >
                    {state === "submitting" ? (
                      <>
                        <span className="h-3 w-3 animate-spin rounded-full border-[1.5px] border-background/40 border-t-background" />
                        <span className="label-mono">Generating…</span>
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4" />
                        <span className="label-mono">Send my PDF</span>
                      </>
                    )}
                  </button>

                  <p className="mt-3 text-center text-[11px] text-muted-2">
                    No spam. One email when we ship the next thing.
                  </p>
                </form>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
