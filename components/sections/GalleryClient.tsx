"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { urlFor } from "@/lib/sanity";
import type { GalleryItem } from "@/types";
import FilterPill from "@/components/ui/FilterPill";
import { CLUB_GALLERY_FILTER } from "@/lib/gallery";
import { LOCALE_TAGS, type Locale } from "@/i18n/routing";
import { compareText } from "@/lib/i18n/format";

// ─── Constants ────────────────────────────────────────────────────────────────

/** Filter values besides a team id. */
const ALL = "alle";

/** Query parameter the team pages use to deep-link into a team's photos. */
const TEAM_PARAM = "team";

type GalleryTeam = NonNullable<GalleryItem["team"]>;

// ─── Main component ───────────────────────────────────────────────────────────

export default function GalleryClient({ items }: { items: GalleryItem[] }) {
  const t = useTranslations("gallery");
  const tag = LOCALE_TAGS[useLocale() as Locale];
  const teams = useMemo(() => uniqueTeams(items, tag), [items, tag]);
  const hasClubPhotos = useMemo(() => items.some((item) => !item.team), [items]);
  const requestedTeam = useSearchParams().get(TEAM_PARAM);

  const filterOptions = useMemo(
    () => [
      { value: ALL, label: t("filters.all") },
      ...(hasClubPhotos ? [{ value: CLUB_GALLERY_FILTER, label: t("clubLabel") }] : []),
      ...teams.map((team) => ({ value: team._id, label: team.name })),
    ],
    [teams, hasClubPhotos, t]
  );

  const [activeFilter, setActiveFilter] = useState<string>(() => {
    if (requestedTeam === CLUB_GALLERY_FILTER) return CLUB_GALLERY_FILTER;
    return teams.find((t) => t.slug.current === requestedTeam)?._id ?? ALL;
  });
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const filtered = useMemo(
    () =>
      items.filter((item) => {
        if (activeFilter === ALL) return true;
        if (activeFilter === CLUB_GALLERY_FILTER) return !item.team;
        return item.team?._id === activeFilter;
      }),
    [items, activeFilter]
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

  const handleFilterChange = (value: string) => {
    setActiveFilter(value);
    setLightboxIndex(null);
  };

  return (
    <div className="bg-background dark:bg-gray-900 min-h-[60vh]">
      {/* ── Filter bar ──────────────────────────────────────────────────── */}
      <div className="material-bar sticky top-[54px] lg:top-[60px] z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center gap-2 overflow-x-auto pb-0.5">
            {filterOptions.map(({ value, label }) => (
              <FilterPill
                key={value}
                label={label}
                active={activeFilter === value}
                onClick={() => handleFilterChange(value)}
              />
            ))}
            <span className="ml-auto shrink-0 text-xs text-muted tabular-nums">
              {t("count", { count: filtered.length })}
            </span>
          </div>
        </div>
      </div>

      {/* ── Masonry grid ────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
        {filtered.length === 0 ? (
          <p className="text-muted text-sm py-10 text-center">
            {t("empty")}
          </p>
        ) : (
          <div className="columns-2 md:columns-3 xl:columns-4 gap-3 md:gap-4">
            {filtered.map((item, index) => (
              <MasonryItem
                key={item._id}
                item={item}
                clubLabel={t("clubLabel")}
                onClick={() => openLightbox(index)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Lightbox ────────────────────────────────────────────────────── */}
      <Lightbox
        items={filtered}
        clubLabel={t("clubLabel")}
        index={lightboxIndex}
        onClose={closeLightbox}
        onNext={goNext}
        onPrev={goPrev}
      />
    </div>
  );
}

/** Teams that have at least one photo, in order of first appearance. */
function uniqueTeams(items: GalleryItem[], tag: string): GalleryTeam[] {
  const byId = new Map<string, GalleryTeam>();
  for (const { team } of items) {
    if (team?.slug?.current) byId.set(team._id, team);
  }
  return [...byId.values()].sort((a, b) => compareText(tag, a.name, b.name));
}

// ─── Masonry item ─────────────────────────────────────────────────────────────

function MasonryItem({
  item,
  clubLabel,
  onClick,
}: {
  item: GalleryItem;
  clubLabel: string;
  onClick: () => void;
}) {
  const t = useTranslations("gallery");
  const src = urlFor(item.image).width(600).url();
  const alt = item.image.alt ?? item.caption ?? t("imageAlt");

  return (
    <button
      type="button"
      aria-label={alt}
      onClick={onClick}
      className="break-inside-avoid mb-3 md:mb-4 group press-card relative overflow-hidden rounded-2xl bg-gray-100 dark:bg-gray-700 w-full text-left appearance-none"
    >
      <Image
        src={src}
        alt={alt}
        width={600}
        height={400}
        sizes="(max-width: 768px) 50vw, (max-width: 1280px) 33vw, 25vw"
        className="w-full h-auto object-cover motion-safe:group-hover:scale-[1.03] transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
        {item.caption && (
          <p className="text-white text-xs font-medium leading-snug line-clamp-2">
            {item.caption}
          </p>
        )}
        <span className="inline-block mt-1.5 text-xs font-bold uppercase tracking-[0.12em] text-white/75">
          {item.team?.name ?? clubLabel}
        </span>
      </div>
    </button>
  );
}

// ─── Lightbox ─────────────────────────────────────────────────────────────────

interface LightboxProps {
  items: GalleryItem[];
  clubLabel: string;
  index: number | null;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
}

function Lightbox({ items, clubLabel, index, onClose, onNext, onPrev }: LightboxProps) {
  const t = useTranslations("gallery");
  const prefersReduced = useReducedMotion() ?? false;
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
            className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          <motion.div
            key="panel"
            initial={{ opacity: 0, scale: prefersReduced ? 1 : 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: prefersReduced ? 1 : 0.92 }}
            transition={{ type: "spring", bounce: 0, duration: prefersReduced ? 0 : 0.4 }}
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
                  alt={item.image.alt ?? item.caption ?? t("imageAlt")}
                  width={1400}
                  height={900}
                  sizes="90vw"
                  className="object-contain max-h-[75vh] w-auto rounded-2xl shadow-2xl"
                  priority
                />
              </div>

              <div className="mt-4 flex items-center gap-3 max-w-[85vw]">
                {item.caption && (
                  <p className="text-white/80 text-sm leading-snug flex-1 text-center">
                    {item.caption}
                  </p>
                )}
                <span className="shrink-0 text-xs font-bold uppercase tracking-[0.12em] text-white/70 border border-white/25 px-2.5 py-0.5 rounded-full">
                  {item.team?.name ?? clubLabel}
                </span>
              </div>

              <p className="mt-2 text-xs text-white/60 tabular-nums">
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
            className="fixed top-4 right-4 z-[60] press p-2 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md text-white transition-colors"
            aria-label={t("lightbox.close")}
          >
            <X size={22} />
          </motion.button>

          {items.length > 1 && (
            <motion.button
              key="prev"
              initial={{ opacity: 0, x: prefersReduced ? 0 : -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: prefersReduced ? 0 : -8 }}
              transition={{ duration: 0.2 }}
              onClick={onPrev}
              className="fixed left-3 md:left-6 top-1/2 -translate-y-1/2 z-[60] press p-2.5 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md text-white transition-colors"
              aria-label={t("lightbox.previous")}
            >
              <ChevronLeft size={26} />
            </motion.button>
          )}

          {items.length > 1 && (
            <motion.button
              key="next"
              initial={{ opacity: 0, x: prefersReduced ? 0 : 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: prefersReduced ? 0 : 8 }}
              transition={{ duration: 0.2 }}
              onClick={onNext}
              className="fixed right-3 md:right-6 top-1/2 -translate-y-1/2 z-[60] press p-2.5 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md text-white transition-colors"
              aria-label={t("lightbox.next")}
            >
              <ChevronRight size={26} />
            </motion.button>
          )}
        </>
      )}
    </AnimatePresence>
  );
}
