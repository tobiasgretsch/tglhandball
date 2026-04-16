"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Document, Page, pdfjs } from "react-pdf";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { X, ChevronLeft, ChevronRight, Loader2, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Load worker from CDN matching the installed pdfjs-dist version
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const TOP_BAR_HEIGHT = 48;
const CROSSFADE_DURATION = 0.22;

interface PdfViewerProps {
  url: string;
  onClose: () => void;
}

export default function PdfViewer({ url, onClose }: PdfViewerProps) {
  const [numPages, setNumPages] = useState(0);
  // `pageNumber` = page being requested (may be rendering); `visiblePage` = last fully painted page
  const [pageNumber, setPageNumber] = useState(1);
  const [visiblePage, setVisiblePage] = useState(1);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [naturalSize, setNaturalSize] = useState<{ width: number; height: number } | null>(null);
  const [availableWidth, setAvailableWidth] = useState(0);
  const [availableHeight, setAvailableHeight] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);

  // Measure available container area on mount and resize
  useEffect(() => {
    const measure = () => {
      if (containerRef.current) {
        setAvailableWidth(containerRef.current.clientWidth);
        setAvailableHeight(containerRef.current.clientHeight);
      }
    };
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

  async function handleLoadSuccess(pdf: PDFDocumentProxy) {
    setNumPages(pdf.numPages);
    setStatus("ready");
    const page = await pdf.getPage(1);
    const viewport = page.getViewport({ scale: 1 });
    setNaturalSize({ width: viewport.width, height: viewport.height });
  }

  // Compute the render width that keeps the full page visible within the container.
  function computeRenderWidth(): number | undefined {
    if (!naturalSize || availableWidth === 0 || availableHeight === 0) return undefined;
    const aspectRatio = naturalSize.width / naturalSize.height;
    const widthFromHeight = availableHeight * aspectRatio;
    return Math.min(availableWidth, widthFromHeight);
  }

  function goNext() {
    if (pageNumber < numPages) setPageNumber((p) => p + 1);
  }

  function goPrev() {
    if (pageNumber > 1) setPageNumber((p) => p - 1);
  }

  function handleTap(e: React.MouseEvent<HTMLDivElement>) {
    if (e.clientX < window.innerWidth / 2) goPrev();
    else goNext();
  }

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

  // Called when the incoming page has fully painted onto the canvas.
  // Only then do we reveal it — this eliminates the white-canvas flash.
  function handlePageRenderSuccess() {
    setVisiblePage(pageNumber);
  }

  const renderWidth = computeRenderWidth();
  const renderHeight =
    renderWidth && naturalSize
      ? renderWidth * (naturalSize.height / naturalSize.width)
      : undefined;

  // True while the incoming page is still rendering
  const isChanging = pageNumber !== visiblePage;

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-black flex flex-col select-none">
      {/* Top bar */}
      <div
        className="flex items-center justify-between px-3 shrink-0 bg-black/70 backdrop-blur-sm border-b border-white/10"
        style={{ height: TOP_BAR_HEIGHT }}
      >
        <button
          onClick={goPrev}
          disabled={pageNumber <= 1}
          aria-label="Vorherige Seite"
          className="p-2 text-white/60 hover:text-white disabled:opacity-20 transition-colors"
        >
          <ChevronLeft size={20} />
        </button>

        <span className="text-white/70 text-sm font-medium tabular-nums">
          {status === "ready" ? `${visiblePage} / ${numPages}` : "…"}
        </span>

        <button
          onClick={onClose}
          aria-label="Schließen"
          className="p-2 text-white/60 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      {/* PDF content area — no scrolling, page always fits entirely */}
      <div
        ref={containerRef}
        className="flex-1 overflow-hidden flex items-center justify-center relative"
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
          onLoadSuccess={handleLoadSuccess}
          onLoadError={() => setStatus("error")}
          loading={null}
        >
          {renderWidth !== undefined && renderHeight !== undefined && (
            /*
             * Fixed-size container matching the page dimensions.
             * Both pages occupy the same space via position:absolute so that
             * the outgoing page can stay on top while the incoming page renders
             * invisibly behind it — only revealing itself once fully painted.
             */
            <div className="relative" style={{ width: renderWidth, height: renderHeight }}>
              {/* Outgoing page — sits on top (z-10), fades out after incoming is ready */}
              <AnimatePresence>
                {isChanging && (
                  <motion.div
                    key={`out-${visiblePage}`}
                    className="absolute inset-0 z-10"
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: CROSSFADE_DURATION }}
                  >
                    <Page
                      pageNumber={visiblePage}
                      width={renderWidth}
                      renderAnnotationLayer={false}
                      renderTextLayer={false}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Incoming page — renders invisibly beneath the outgoing page.
                  Snaps to full opacity instantly once painted (no transition needed:
                  the outgoing page at z-10 covers the snap, and since incoming is
                  already at opacity 1 when the outgoing fades, total opacity = 1
                  throughout — no black ever bleeds through). */}
              <div
                key={pageNumber}
                className="absolute inset-0"
                style={{ opacity: isChanging ? 0 : 1 }}
              >
                <Page
                  pageNumber={pageNumber}
                  width={renderWidth}
                  renderAnnotationLayer={false}
                  renderTextLayer={false}
                  onRenderSuccess={handlePageRenderSuccess}
                />
              </div>
            </div>
          )}
        </Document>

        {/* Side arrow hints */}
        {status === "ready" && visiblePage > 1 && (
          <div className="absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none">
            <div className="bg-black/50 rounded-full p-2.5">
              <ChevronLeft size={18} className="text-white/70" />
            </div>
          </div>
        )}
        {status === "ready" && visiblePage < numPages && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
            <div className="bg-black/50 rounded-full p-2.5">
              <ChevronRight size={18} className="text-white/70" />
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
