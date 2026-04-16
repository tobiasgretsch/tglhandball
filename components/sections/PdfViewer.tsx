"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import * as pdfjsLib from "pdfjs-dist";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { X, ChevronLeft, ChevronRight, Loader2, AlertCircle } from "lucide-react";

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

const TOP_BAR_HEIGHT = 48;

interface PdfViewerProps {
  url: string;
  onClose: () => void;
}

/**
 * Renders a single PDF page into a JPEG data URL sized to fill
 * the given container area at the device's pixel ratio.
 */
async function renderPageToDataUrl(
  pdf: PDFDocumentProxy,
  pageNum: number,
  containerWidth: number,
  containerHeight: number
): Promise<string> {
  const page = await pdf.getPage(pageNum);
  const base = page.getViewport({ scale: 1 });
  const dpr = window.devicePixelRatio || 1;

  // Fit within container, preserving aspect ratio
  const aspect = base.width / base.height;
  let w = containerWidth;
  let h = w / aspect;
  if (h > containerHeight) { h = containerHeight; w = h * aspect; }

  const scale = (w * dpr) / base.width;
  const viewport = page.getViewport({ scale });

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(viewport.width);
  canvas.height = Math.round(viewport.height);

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context unavailable");

  // pdfjs-dist v5 requires both `canvas` and `canvasContext` in RenderParameters
  await page.render({ canvas, canvasContext: ctx, viewport }).promise;
  return canvas.toDataURL("image/jpeg", 0.92);
}

export default function PdfViewer({ url, onClose }: PdfViewerProps) {
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  // Changing pageCache state triggers a re-render whenever a page finishes rendering
  const [pageCache, setPageCache] = useState<Map<number, string>>(new Map());

  const pdfRef = useRef<PDFDocumentProxy | null>(null);
  // Shadow ref kept in sync with pageCache — lets stable callbacks read the latest cache
  const pageCacheRef = useRef<Map<number, string>>(new Map());
  const renderingRef = useRef<Set<number>>(new Set());
  const numPagesRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<number | null>(null);

  // Keep shadow ref in sync on every render
  pageCacheRef.current = pageCache;

  // Lock body scroll while viewer is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  // Keyboard navigation (re-registers each render so it captures latest numPages)
  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") navigate(1);
      else if (e.key === "ArrowLeft") navigate(-1);
      else if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  });

  // Load PDF document
  useEffect(() => {
    let cancelled = false;
    pdfjsLib.getDocument(url).promise
      .then((pdf) => {
        if (cancelled) return;
        pdfRef.current = pdf;
        numPagesRef.current = pdf.numPages;
        setNumPages(pdf.numPages);
        setStatus("ready");
      })
      .catch(() => { if (!cancelled) setStatus("error"); });
    return () => { cancelled = true; };
  }, [url]);

  /**
   * Schedule off-screen rendering of a page and cache its data URL.
   * Idempotent — safe to call multiple times for the same page.
   */
  const enqueue = useCallback((pageNum: number) => {
    if (!pdfRef.current || pageNum < 1 || pageNum > numPagesRef.current) return;
    if (pageCacheRef.current.has(pageNum) || renderingRef.current.has(pageNum)) return;

    renderingRef.current.add(pageNum);

    const el = containerRef.current;
    const maxW = el?.clientWidth ?? window.innerWidth;
    const maxH = (el?.clientHeight ?? window.innerHeight) - TOP_BAR_HEIGHT;

    renderPageToDataUrl(pdfRef.current, pageNum, maxW, maxH)
      .then((dataUrl) => {
        setPageCache((prev) => new Map(prev).set(pageNum, dataUrl));
      })
      .catch(() => { /* silently ignore individual page render failures */ })
      .finally(() => renderingRef.current.delete(pageNum));
  }, []);

  // Prime the cache: render page 1 and 2 as soon as the PDF is ready
  useEffect(() => {
    if (status !== "ready") return;
    enqueue(1);
    enqueue(2);
  }, [status, enqueue]);

  // Pre-render the current page and its immediate neighbours on every navigation
  useEffect(() => {
    enqueue(currentPage);
    enqueue(currentPage + 1);
    enqueue(currentPage - 1);
  }, [currentPage, enqueue]);

  function navigate(delta: number) {
    setCurrentPage((p) => Math.max(1, Math.min(p + delta, numPagesRef.current)));
  }

  function handleTap(e: React.MouseEvent<HTMLDivElement>) {
    if (e.clientX < window.innerWidth / 2) navigate(-1);
    else navigate(1);
  }

  function handleTouchStart(e: React.TouchEvent) {
    touchStartRef.current = e.touches[0].clientX;
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartRef.current === null) return;
    const diff = touchStartRef.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 48) {
      if (diff > 0) navigate(1);
      else navigate(-1);
    }
    touchStartRef.current = null;
  }

  const currentImg = pageCache.get(currentPage);
  const showPageSpinner = status === "ready" && !currentImg;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] bg-black flex flex-col select-none touch-none"
      // 100dvh respects mobile browser chrome (address bar, system taskbar)
      style={{ height: "100dvh" }}
    >
      {/* ── Top bar ── */}
      <div
        className="flex items-center justify-between px-2 shrink-0 bg-black/80 backdrop-blur-sm border-b border-white/10"
        style={{ height: TOP_BAR_HEIGHT }}
      >
        <button
          onClick={() => navigate(-1)}
          disabled={currentPage <= 1}
          aria-label="Vorherige Seite"
          className="p-3 text-white/60 hover:text-white active:text-white disabled:opacity-20 transition-colors"
        >
          <ChevronLeft size={20} />
        </button>

        <span className="text-white/70 text-sm font-medium tabular-nums">
          {status === "ready" ? `${currentPage} / ${numPages}` : "…"}
        </span>

        <button
          onClick={onClose}
          aria-label="Schließen"
          className="p-3 text-white/60 hover:text-white active:text-white transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      {/* ── Content area ── */}
      <div
        ref={containerRef}
        className="flex-1 overflow-hidden flex items-center justify-center"
        onClick={handleTap}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {status === "loading" && (
          <Loader2 size={36} className="text-white/30 animate-spin" />
        )}

        {status === "error" && (
          <div className="flex flex-col items-center gap-3 text-white/50">
            <AlertCircle size={36} />
            <p className="text-sm">PDF konnte nicht geladen werden.</p>
          </div>
        )}

        {showPageSpinner && (
          <Loader2 size={36} className="text-white/30 animate-spin" />
        )}

        {currentImg && (
          /*
           * Displaying a pre-rendered JPEG data URL as <img> is flash-free:
           * the browser paints the new src atomically — no intermediate blank state.
           * The previous image stays visible until React commits the new src.
           */
          <img
            key={currentPage}
            src={currentImg}
            alt={`Seite ${currentPage}`}
            className="max-w-full max-h-full object-contain pointer-events-none"
            style={{ maxHeight: `calc(100dvh - ${TOP_BAR_HEIGHT}px)` }}
            draggable={false}
          />
        )}
      </div>
    </div>,
    document.body
  );
}
