"use client";

import { useState, useEffect, useRef } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { X, ChevronLeft, ChevronRight, Loader2, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Load worker from CDN matching the installed pdfjs-dist version
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PdfViewerProps {
  url: string;
  onClose: () => void;
}

export default function PdfViewer({ url, onClose }: PdfViewerProps) {
  const [numPages, setNumPages] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [pageHeight, setPageHeight] = useState(0);
  const [direction, setDirection] = useState(0);
  const touchStartX = useRef<number | null>(null);

  // Height = viewport minus the 48px top bar so the full page is always visible
  useEffect(() => {
    const measure = () => setPageHeight(window.innerHeight - 48);
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  // Lock body scroll while viewer is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") goNext();
      else if (e.key === "ArrowLeft") goPrev();
      else if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  function goNext() {
    if (pageNumber < numPages) {
      setDirection(1);
      setPageNumber((p) => p + 1);
    }
  }

  function goPrev() {
    if (pageNumber > 1) {
      setDirection(-1);
      setPageNumber((p) => p - 1);
    }
  }

  // Tap left/right half of screen to navigate
  function handleTap(e: React.MouseEvent<HTMLDivElement>) {
    if (e.clientX < window.innerWidth / 2) goPrev();
    else goNext();
  }

  // Swipe detection
  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 48) {
      if (diff > 0) goNext();
      else goPrev();
    }
    touchStartX.current = null;
  }

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col select-none">
      {/* Top bar */}
      <div className="flex items-center justify-between px-3 h-12 shrink-0 bg-black/70 backdrop-blur-sm border-b border-white/10">
        <button
          onClick={goPrev}
          disabled={pageNumber <= 1}
          aria-label="Vorherige Seite"
          className="p-2 text-white/60 hover:text-white disabled:opacity-20 transition-colors"
        >
          <ChevronLeft size={20} />
        </button>

        <span className="text-white/70 text-sm font-medium tabular-nums">
          {status === "ready" ? `${pageNumber} / ${numPages}` : "…"}
        </span>

        <button
          onClick={onClose}
          aria-label="Schließen"
          className="p-2 text-white/60 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      {/* PDF content area */}
      <div
        className="flex-1 overflow-hidden relative"
        onClick={handleTap}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Loading spinner */}
        {status === "loading" && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <Loader2 size={36} className="text-white/30 animate-spin" />
          </div>
        )}

        {/* Error state */}
        {status === "error" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white/50 pointer-events-none">
            <AlertCircle size={36} />
            <p className="text-sm">PDF konnte nicht geladen werden.</p>
          </div>
        )}

        <Document
          file={url}
          onLoadSuccess={({ numPages }) => {
            setNumPages(numPages);
            setStatus("ready");
          }}
          onLoadError={() => setStatus("error")}
          loading={null}
          className="h-full flex items-center justify-center overflow-y-auto"
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={pageNumber}
              initial={{ opacity: 0, x: direction * 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction * -50 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="flex items-center justify-center"
            >
              {pageHeight > 0 && (
                <Page
                  pageNumber={pageNumber}
                  height={pageHeight}
                  renderAnnotationLayer={false}
                  renderTextLayer={false}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </Document>

        {/* Side arrow hints — visible but non-blocking */}
        {status === "ready" && pageNumber > 1 && (
          <div className="absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none">
            <div className="bg-black/50 rounded-full p-2.5">
              <ChevronLeft size={18} className="text-white/70" />
            </div>
          </div>
        )}
        {status === "ready" && pageNumber < numPages && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
            <div className="bg-black/50 rounded-full p-2.5">
              <ChevronRight size={18} className="text-white/70" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
