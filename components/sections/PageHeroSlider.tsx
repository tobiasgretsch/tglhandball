"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { urlFor } from "@/lib/sanity";
import type { SanityImage } from "@/types";

interface PageHeroSliderProps {
  slides: SanityImage[];
  children: React.ReactNode;
  /** Extra classes on the outer <section> (e.g. min-h-* flex items-end). */
  className?: string;
}

const SLIDE_INTERVAL_MS = 5000;

export default function PageHeroSlider({
  slides,
  children,
  className = "",
}: PageHeroSliderProps) {
  const [current, setCurrent] = useState(0);
  const hasSlides = slides.length > 0;

  // Randomise the starting slide after hydration to avoid SSR mismatch.
  useEffect(() => {
    if (slides.length > 1) {
      setCurrent(Math.floor(Math.random() * slides.length));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(
      () => setCurrent((i) => (i + 1) % slides.length),
      SLIDE_INTERVAL_MS
    );
    return () => clearInterval(timer);
  }, [slides.length]);

  return (
    <section
      className={`relative overflow-hidden -mt-[68px] lg:-mt-[76px] min-h-[340px] md:min-h-[400px] lg:min-h-[500px] flex items-end ${className}`}
    >
      {/* ── Background layer ─────────────────────────────────────────── */}
      {hasSlides ? (
        <AnimatePresence initial={false}>
          <motion.div
            key={current}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.9, ease: "easeInOut" }}
            className="absolute inset-x-0 bottom-0 top-[68px] lg:top-[76px]"
          >
            <Image
              src={urlFor(slides[current]).width(1920).height(640).url()}
              alt={(slides[current] as SanityImage & { alt?: string }).alt ?? ""}
              fill
              sizes="100vw"
              className="object-cover object-top"
              priority
            />
          </motion.div>
        </AnimatePresence>
      ) : (
        /* Fallback: original accent-blue gradient when no slides are set */
        <div className="absolute inset-0 bg-gradient-to-br from-accent via-accent to-[#003a7a]" />
      )}

      {/* ── Gradient overlay ─────────────────────────────────────────────
           Left  (0 → ~55%): strong accent-blue so text stays readable
           Right (55% → 100%): fades to transparent so photo is fully visible */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(to right, rgba(0,79,159,0.93) 0%, rgba(0,79,159,0.82) 30%, rgba(0,79,159,0.45) 55%, rgba(0,0,0,0.08) 80%, transparent 100%)",
        }}
      />

      {/* ── Subtle diagonal stripe texture (design continuity) ─────────── */}
      <div
        className="absolute inset-0 opacity-[0.06] pointer-events-none"
        style={{
          background:
            "repeating-linear-gradient(-55deg,transparent,transparent 12px,rgba(255,255,255,0.15) 12px,rgba(255,255,255,0.15) 24px)",
        }}
      />

      {/* ── Dot indicators (only when >1 slide) ──────────────────────── */}
      {slides.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              aria-label={`Foto ${i + 1}`}
              className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                i === current
                  ? "bg-white scale-125"
                  : "bg-white/40 hover:bg-white/70"
              }`}
            />
          ))}
        </div>
      )}

      {/* ── Page content (passed as children) ────────────────────────── */}
      <div className="relative">{children}</div>
    </section>
  );
}
