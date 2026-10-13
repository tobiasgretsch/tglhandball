"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { FileText } from "lucide-react";

// pdfjs-dist uses browser-only APIs (DOMMatrix) — never run on the server
const PdfViewer = dynamic(() => import("@/components/sections/PdfViewer"), { ssr: false });

interface MatchReportButtonProps {
  meetingId: string;
  /** Visual variant: "glass" on dark backgrounds, "light" on white cards. */
  tone?: "glass" | "light";
}

const TONE_CLASS = {
  glass: "btn btn-glass",
  light: "btn bg-accent hover:bg-accent-deep",
} as const;

/** Opens the nuLiga match report (Spielbericht) in the in-page PDF viewer. */
export default function MatchReportButton({ meetingId, tone = "light" }: MatchReportButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {open && (
        <PdfViewer url={`/api/nuliga/report/${meetingId}`} onClose={() => setOpen(false)} />
      )}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`${TONE_CLASS[tone]} px-3.5! py-1.5! text-xs!`}
      >
        <FileText size={13} aria-hidden="true" />
        Spielbericht
      </button>
    </>
  );
}
