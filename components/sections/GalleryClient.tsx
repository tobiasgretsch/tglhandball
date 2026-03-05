"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { urlFor } from "@/lib/sanity";
import type { GalleryItem, GalleryCategory } from "@/types";

// ─── Constants ────────────────────────────────────────────────────────────────

type FilterCategory = GalleryCategory | "alle";

const FILTER_OPTIONS: { value: FilterCategory; label: string }[] = [
  { value: "alle",    label: "Alle"   },
  { value: "herren",  label: "Herren" },
  { value: "damen",   label: "Damen"  },
  { value: "jugend",  label: "Jugend" },
  { value: "events",  label: "Events" },
];

const CATEGORY_LABELS: Record<GalleryCategory, string> = {
  herren: "Herren",
  damen:  "Damen",
  jugend: "Jugend",
  events: "Events",
};

// ─── Main component ───────────────────────────────────────────────────────────

export default function GalleryClient({ items }: { items: GalleryItem[] }) {
  const [activeCategory, setActiveCategory] = useState<FilterCategory>("alle");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const filtered = useMemo(
    () =>
      activeCategory === "alle"
        ? items
        : items.filter((item) => item.category === activeCategory),
    [items, activeCategory]
  );

  const openLightbox = useCallback((index: number) => setLightboxIndex(index), []);
  const closeLightbox = useCallback(() => setLightboxIndex(null), []);
  const goNext = useCallback(() => {
    setLightboxIndex((prev) =>
      prev === null ? null : (prev + 1) % filtered.length
    );
  }, [filtered.length]);
  const goPrev = useCallback(() => {
    setLightboxIndex((prev) =>
      prev === null ? null : (prev - 1 + filtered.length) % filtered.length
    );
  }, [filtered.length]);

  const handleCategoryChange = (cat: FilterCategory) => {
    setActiveCategory(cat);
    setLightboxIndex(null);
  };

  return (
    <div className="bg-background dark:bg-gray-900 min-h-[60vh]">
      {/* ── Filter bar ──────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 sticky top-[68px] lg:top-[76px] z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center gap-2 overflow-x-auto pb-0.5">
            {FILTER_OPTIONS.map(({ value, label }) => (
              <FilterPill
                key={value}
                label={label}
                active={activeCategory === value}
                onClick={() => handleCategoryChange(value)}
              />
            ))}
            <span className="ml-auto shrink-0 text-[11px] text-muted dark:text-gray-400 tabular-nums">
              {filtered.length} Bild{filtered.length !== 1 ? "er" : ""}
            </span>
          </div>
        </div>
      </div>

      {/* ── Masonry grid ────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
        {filtered.length === 0 ? (
          <p className="text-muted dark:text-gray-400 text-sm py-10 text-center">
            Keine Bilder in dieser Kategorie.
          </p>
        ) : (
          <div className="columns-2 md:columns-3 xl:columns-4 gap-3 md:gap-4">
            {filtered.map((item, index) => (
              <MasonryItem
                key={item._id}
                item={item}
                onClick={() => openLightbox(index)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Lightbox ────────────────────────────────────────────────────── */}
      <Lightbox
        items={filtered}
        index={lightboxIndex}
        onClose={closeLightbox}
        onNext={goNext}
        onPrev={goPrev}
      />
    </div>
  );
}

// ─── Filter pill ─────────────────────────────────────────────────────────────

function FilterPill({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 px-4 py-1.5 rounded-full text-[12px] font-bold uppercase tracking-wide transition-colors border ${
        active
          ? "bg-primary border-primary text-white shadow-sm shadow-primary/20"
          : "bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-muted dark:text-gray-400 hover:border-primary hover:text-primary"
      }`}
    >
      {label}
    </button>
  );
}

// ─── Masonry item ─────────────────────────────────────────────────────────────

function MasonryItem({
  item,
  onClick,
}: {
  item: GalleryItem;
  onClick: () => void;
}) {
  const src = urlFor(item.image).width(600).url();
  const alt = item.image.alt ?? item.caption ?? "Galeriebild";

  return (
    <div
      className="break-inside-avoid mb-3 md:mb-4 group relative overflow-hidden rounded-lg cursor-pointer bg-gray-100 dark:bg-gray-700"
      onClick={onClick}
    >
      <Image
        src={src}
        alt={alt}
        width={600}
        height={400}
        sizes="(max-width: 768px) 50vw, (max-width: 1280px) 33vw, 25vw"
        className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
        {item.caption && (
          <p className="text-white text-[12px] font-medium leading-snug line-clamp-2">
            {item.caption}
          </p>
        )}
        {item.category && (
          <span className="inline-block mt-1.5 text-[10px] font-bold uppercase tracking-widest text-white/60">
            {CATEGORY_LABELS[item.category]}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Lightbox ─────────────────────────────────────────────────────────────────

interface LightboxProps {
  items: GalleryItem[];
  index: number | null;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
}

function Lightbox({ items, index, onClose, onNext, onPrev }: LightboxProps) {
  const isOpen = index !== null;
  const item = isOpen ? items[index] : null;

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") onNext();
      if (e.key === "ArrowLeft") onPrev();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose, onNext, onPrev]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && item && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/90 z-50"
            onClick={onClose}
          />

          <motion.div
            key="panel"
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
            className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
          >
            <div
              className="relative pointer-events-auto max-w-[90vw] max-h-[90vh] flex flex-col items-center"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative max-w-[85vw] max-h-[75vh]">
                <Image
                  key={item._id}
                  src={urlFor(item.image).width(1400).url()}
                  alt={item.image.alt ?? item.caption ?? "Galeriebild"}
                  width={1400}
                  height={900}
                  sizes="90vw"
                  className="object-contain max-h-[75vh] w-auto rounded-sm shadow-2xl"
                  priority
                />
              </div>

              {(item.caption || item.category) && (
                <div className="mt-4 flex items-center gap-3 max-w-[85vw]">
                  {item.caption && (
                    <p className="text-white/80 text-sm leading-snug flex-1 text-center">
                      {item.caption}
                    </p>
                  )}
                  {item.category && (
                    <span className="shrink-0 text-[10px] font-bold uppercase tracking-widest text-white/40 border border-white/20 px-2 py-0.5 rounded">
                      {CATEGORY_LABELS[item.category]}
                    </span>
                  )}
                </div>
              )}

              <p className="mt-2 text-[11px] text-white/30 tabular-nums">
                {index! + 1} / {items.length}
              </p>
            </div>
          </motion.div>

          <motion.button
            key="close"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed top-4 right-4 z-[60] p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            aria-label="Schließen"
          >
            <X size={22} />
          </motion.button>

          {items.length > 1 && (
            <motion.button
              key="prev"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.2 }}
              onClick={onPrev}
              className="fixed left-3 md:left-6 top-1/2 -translate-y-1/2 z-[60] p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
              aria-label="Vorheriges Bild"
            >
              <ChevronLeft size={26} />
            </motion.button>
          )}

          {items.length > 1 && (
            <motion.button
              key="next"
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 8 }}
              transition={{ duration: 0.2 }}
              onClick={onNext}
              className="fixed right-3 md:right-6 top-1/2 -translate-y-1/2 z-[60] p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
              aria-label="Nächstes Bild"
            >
              <ChevronRight size={26} />
            </motion.button>
          )}
        </>
      )}
    </AnimatePresence>
  );
}
