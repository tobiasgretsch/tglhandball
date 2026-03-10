"use client";

import { useState } from "react";
import { BookOpen } from "lucide-react";
import dynamic from "next/dynamic";

// pdfjs-dist uses browser-only APIs (DOMMatrix) — never run on the server
const PdfViewer = dynamic(() => import("@/components/sections/PdfViewer"), { ssr: false });

interface PdfOpenButtonProps {
  url: string;
  label?: string;
}

export default function PdfOpenButton({ url, label = "PDF öffnen" }: PdfOpenButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {open && <PdfViewer url={url} onClose={() => setOpen(false)} />}
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-accent text-white text-[11px] font-bold uppercase tracking-wide hover:bg-accent/85 transition-colors w-full sm:w-auto sm:whitespace-nowrap"
      >
        <BookOpen size={13} />
        {label}
      </button>
    </>
  );
}
