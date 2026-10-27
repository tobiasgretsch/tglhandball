"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import * as pdfjsLib from "pdfjs-dist";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { X, ChevronLeft, Loader2, AlertCircle, ZoomIn, ZoomOut } from "lucide-react";

// Bundled with the site: no third-party CDN request (DSGVO — no IP transfer to a CDN).
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

const TOP_BAR_HEIGHT = 48;
const MIN_ZOOM = 1;
const MAX_ZOOM = 4;
const ZOOM_STEP = 1.5;
const WHEEL_ZOOM_SENSITIVITY = 0.0015;
/** Zoomed pages are re-rendered at this multiple of the fit-to-screen resolution. */
const HIGH_RES_BOOST = 3;
/** Keeps the canvas under iOS Safari's ~16.7M pixel limit. */
const MAX_CANVAS_PIXELS = 12_000_000;
const SWIPE_THRESHOLD_PX = 48;
const DRAG_THRESHOLD_PX = 4;

const clampZoom = (z: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z));
const distance = (a: { x: number; y: number }, b: { x: number; y: number }) =>
  Math.hypot(a.x - b.x, a.y - b.y);

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
  containerHeight: number,
  boost = 1
): Promise<string> {
  const page = await pdf.getPage(pageNum);
  const base = page.getViewport({ scale: 1 });
  const dpr = window.devicePixelRatio || 1;

  // Fit within container, preserving aspect ratio
  const aspect = base.width / base.height;
  let w = containerWidth;
  let h = w / aspect;
  if (h > containerHeight) { h = containerHeight; w = h * aspect; }

  const maxScale = Math.sqrt(MAX_CANVAS_PIXELS / (base.width * base.height));
  const scale = Math.min((w * dpr * boost) / base.width, maxScale);
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
  const t = useTranslations("magazine.viewer");
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  // Changing pageCache state triggers a re-render whenever a page finishes rendering
  const [pageCache, setPageCache] = useState<Map<number, string>>(new Map());

  const [zoom, setZoom] = useState(MIN_ZOOM);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  // Sharp re-renders of pages, produced lazily while zoomed in
  const [hiResCache, setHiResCache] = useState<Map<number, string>>(new Map());

  const pdfRef = useRef<PDFDocumentProxy | null>(null);
  const hiResRenderingRef = useRef<Set<number>>(new Set());
  const imgRef = useRef<HTMLImageElement>(null);
  const pointersRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const pinchRef = useRef<{ startDistance: number; startZoom: number } | null>(null);
  const draggedRef = useRef(false);
  const gestureWasMultiRef = useRef(false);
  // Mirror of pageCache for the stable `enqueue` callback (written where pages finish rendering)
  const pageCacheRef = useRef<Map<number, string>>(new Map());
  const renderingRef = useRef<Set<number>>(new Set());
  const numPagesRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<number | null>(null);

  // Lock body scroll while viewer is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  function navigate(delta: number) {
    setCurrentPage((p) => {
      const next = Math.max(1, Math.min(p + delta, numPagesRef.current));
      if (next !== p) resetZoom();
      return next;
    });
  }

  function resetZoom() {
    setZoom(MIN_ZOOM);
    setPan({ x: 0, y: 0 });
  }

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
        pageCacheRef.current.set(pageNum, dataUrl);
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

  // While zoomed in, render the current page at high resolution so text stays sharp
  useEffect(() => {
    if (zoom <= MIN_ZOOM || status !== "ready" || !pdfRef.current) return;
    const page = currentPage;
    if (hiResCache.has(page) || hiResRenderingRef.current.has(page)) return;

    hiResRenderingRef.current.add(page);
    const el = containerRef.current;
    const maxW = el?.clientWidth ?? window.innerWidth;
    const maxH = (el?.clientHeight ?? window.innerHeight) - TOP_BAR_HEIGHT;

    renderPageToDataUrl(pdfRef.current, page, maxW, maxH, HIGH_RES_BOOST)
      .then((dataUrl) => setHiResCache((prev) => new Map(prev).set(page, dataUrl)))
      .catch(() => { /* keep showing the base render */ })
      .finally(() => hiResRenderingRef.current.delete(page));
  }, [zoom, currentPage, status, hiResCache]);

  /** Pan limit per axis: how far the zoomed image may travel before an edge shows. */
  function clampPan(next: { x: number; y: number }, z: number) {
    const img = imgRef.current;
    if (!img) return next;
    const maxX = Math.max(0, (img.offsetWidth * z - (containerRef.current?.clientWidth ?? 0)) / 2);
    const maxY = Math.max(0, (img.offsetHeight * z - (containerRef.current?.clientHeight ?? 0)) / 2);
    return {
      x: Math.min(maxX, Math.max(-maxX, next.x)),
      y: Math.min(maxY, Math.max(-maxY, next.y)),
    };
  }

  function applyZoom(nextZoom: number) {
    const z = clampZoom(nextZoom);
    setZoom(z);
    setPan((p) => (z === MIN_ZOOM ? { x: 0, y: 0 } : clampPan(p, z)));
  }

  function handleTap(e: React.MouseEvent<HTMLDivElement>) {
    // A tap flips pages only at fit-to-screen; zoomed in, gestures belong to pan/pinch.
    if (zoom > MIN_ZOOM || draggedRef.current || gestureWasMultiRef.current) return;
    if (e.clientX < window.innerWidth / 2) navigate(-1);
    else navigate(1);
  }

  function handlePointerDown(e: React.PointerEvent) {
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    draggedRef.current = false;
    if (pointersRef.current.size === 2) {
      const [a, b] = [...pointersRef.current.values()];
      pinchRef.current = { startDistance: distance(a, b), startZoom: zoom };
      gestureWasMultiRef.current = true;
    } else if (pointersRef.current.size === 1) {
      gestureWasMultiRef.current = false;
    }
  }

  function handlePointerMove(e: React.PointerEvent) {
    const previous = pointersRef.current.get(e.pointerId);
    if (!previous) return;
    const current = { x: e.clientX, y: e.clientY };
    pointersRef.current.set(e.pointerId, current);

    const pinch = pinchRef.current;
    if (pinch && pointersRef.current.size === 2) {
      const [a, b] = [...pointersRef.current.values()];
      applyZoom(pinch.startZoom * (distance(a, b) / pinch.startDistance));
      return;
    }
    if (zoom <= MIN_ZOOM || pointersRef.current.size !== 1) return;

    const dx = current.x - previous.x;
    const dy = current.y - previous.y;
    if (Math.hypot(dx, dy) > DRAG_THRESHOLD_PX) draggedRef.current = true;
    setPan((p) => clampPan({ x: p.x + dx, y: p.y + dy }, zoom));
  }

  function handlePointerEnd(e: React.PointerEvent) {
    pointersRef.current.delete(e.pointerId);
    if (pointersRef.current.size < 2) pinchRef.current = null;
  }

  function handleWheel(e: React.WheelEvent) {
    applyZoom(zoom * Math.exp(-e.deltaY * WHEEL_ZOOM_SENSITIVITY));
  }

  function handleTouchStart(e: React.TouchEvent) {
    touchStartRef.current = e.touches[0].clientX;
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartRef.current === null) return;
    const swipeAllowed = zoom <= MIN_ZOOM && !gestureWasMultiRef.current;
    const diff = touchStartRef.current - e.changedTouches[0].clientX;
    if (swipeAllowed && Math.abs(diff) > SWIPE_THRESHOLD_PX) {
      if (diff > 0) navigate(1);
      else navigate(-1);
    }
    touchStartRef.current = null;
  }

  const currentImg = hiResCache.get(currentPage) ?? pageCache.get(currentPage);
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
          aria-label={t("previousPage")}
          className="p-3 text-white/60 hover:text-white active:text-white disabled:opacity-20 transition-colors"
        >
          <ChevronLeft size={20} />
        </button>

        <div className="flex items-center gap-1">
          <button
            onClick={() => applyZoom(zoom / ZOOM_STEP)}
            disabled={zoom <= MIN_ZOOM}
            aria-label={t("zoomOut")}
            className="p-3 text-white/60 hover:text-white active:text-white disabled:opacity-20 transition-colors"
          >
            <ZoomOut size={20} />
          </button>
          <span className="text-white/70 text-sm font-medium tabular-nums min-w-[3.5rem] text-center">
            {status === "ready" ? `${currentPage} / ${numPages}` : "…"}
          </span>
          <button
            onClick={() => applyZoom(zoom * ZOOM_STEP)}
            disabled={zoom >= MAX_ZOOM}
            aria-label={t("zoomIn")}
            className="p-3 text-white/60 hover:text-white active:text-white disabled:opacity-20 transition-colors"
          >
            <ZoomIn size={20} />
          </button>
        </div>

        <button
          onClick={onClose}
          aria-label={t("close")}
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
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
        onWheel={handleWheel}
      >
        {status === "loading" && (
          <Loader2 size={36} className="text-white/30 animate-spin" />
        )}

        {status === "error" && (
          <div className="flex flex-col items-center gap-3 text-white/50">
            <AlertCircle size={36} />
            <p className="text-sm">{t("loadError")}</p>
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
          // eslint-disable-next-line @next/next/no-img-element -- data URL from pdf.js; next/image cannot optimise it
          <img
            ref={imgRef}
            key={currentPage}
            src={currentImg}
            alt={`Seite ${currentPage}`}
            className="max-w-full max-h-full object-contain pointer-events-none"
            style={{
              maxHeight: `calc(100dvh - ${TOP_BAR_HEIGHT}px)`,
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            }}
            draggable={false}
          />
        )}
      </div>
    </div>,
    document.body
  );
}
