"use client";

import { useState } from "react";
import { BookOpen } from "lucide-react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";

// pdfjs-dist uses browser-only APIs (DOMMatrix) — never run on the server
const PdfViewer = dynamic(() => import("@/components/sections/PdfViewer"), { ssr: false });

interface PdfOpenButtonProps {
  url: string;
  label?: string;
}

export default function PdfOpenButton({ url, label }: PdfOpenButtonProps) {
  const t = useTranslations("magazine");
  const [open, setOpen] = useState(false);

  return (
    <>
      {open && <PdfViewer url={url} onClose={() => setOpen(false)} />}
      <button
        onClick={() => setOpen(true)}
        className="btn bg-accent hover:bg-accent-deep !py-2.5 !px-5 !text-sm w-full sm:w-auto sm:whitespace-nowrap"
      >
        <BookOpen size={15} aria-hidden="true" />
        {label ?? t("openPdf")}
      </button>
    </>
  );
}
