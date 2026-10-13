"use client";

import { useState } from "react";
import Link from "next/link";
import { FileText, Users } from "lucide-react";
import dynamic from "next/dynamic";
import PortableText from "@/components/ui/PortableText";
import type { PortableTextBlock } from "@/types";

const PdfViewer = dynamic(() => import("@/components/sections/PdfViewer"), { ssr: false });

interface PartnerInfoBlockProps {
  text?: PortableTextBlock[];
  pdfUrl?: string;
}

export default function PartnerInfoBlock({ text, pdfUrl }: PartnerInfoBlockProps) {
  const [viewerOpen, setViewerOpen] = useState(false);

  return (
    <>
      {viewerOpen && pdfUrl && (
        <PdfViewer url={pdfUrl} onClose={() => setViewerOpen(false)} />
      )}

      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-[0_1px_2px_rgb(0_0_0/0.06),0_16px_40px_-16px_rgb(0_0_0/0.2)] p-8 md:p-10">
        {text && text.length > 0 && (
          <PortableText value={text} className="mb-8 max-w-3xl" />
        )}
        <div className="flex flex-col sm:flex-row gap-3">
          {pdfUrl && (
            <button
              onClick={() => setViewerOpen(true)}
              className="btn btn-primary w-full sm:w-auto"
            >
              <FileText size={16} className="shrink-0" aria-hidden="true" />
              Imagebroschüre TG MIPA Landshut
            </button>
          )}
          <Link
            href="/foerderverein"
            className="btn press bg-accent hover:bg-accent-deep w-full sm:w-auto"
          >
            <Users size={16} className="shrink-0" aria-hidden="true" />
            Förderverein TG MIPA Landshut
          </Link>
        </div>
      </div>
    </>
  );
}
