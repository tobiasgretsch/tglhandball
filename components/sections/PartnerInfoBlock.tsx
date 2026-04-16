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

      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-8 md:p-10">
        {text && text.length > 0 && (
          <PortableText value={text} className="mb-8 max-w-3xl" />
        )}
        <div className="flex flex-col sm:flex-row gap-3">
          {pdfUrl && (
            <button
              onClick={() => setViewerOpen(true)}
              className="inline-flex items-center justify-center gap-2 bg-primary text-white font-bold text-sm uppercase tracking-wider px-6 py-3 rounded-lg hover:bg-primary-light transition-colors w-full sm:w-auto"
            >
              <FileText size={16} className="shrink-0" />
              Imagebroschüre TG MIPA Landshut
            </button>
          )}
          <Link
            href="/foerderverein"
            className="inline-flex items-center justify-center gap-2 bg-accent text-white font-bold text-sm uppercase tracking-wider px-6 py-3 rounded-lg hover:opacity-90 transition-opacity w-full sm:w-auto"
          >
            <Users size={16} className="shrink-0" />
            Förderverein TG MIPA Landshut
          </Link>
        </div>
      </div>
    </>
  );
}
