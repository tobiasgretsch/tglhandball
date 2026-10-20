"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { urlFor } from "@/lib/sanity";
import type { SanityImage } from "@/types";
import { heroFadeUp } from "@/lib/motion";

interface PageHeroSliderProps {
  slides: SanityImage[];
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  /** Quiet label above the title. */
  eyebrow?: string;
  /** Extra classes on the outer <section> (e.g. min-h-* flex items-end). */
  className?: string;
  /** Background of the rounded sheet edge — must match the first section below. */
  sheetClassName?: string;
}

const SLIDE_INTERVAL_MS = 5000;
const HERO_RISE_PX = 20;

const DEFAULT_SHEET = "bg-background dark:bg-gray-900";

export default function PageHeroSlider({
  slides,
  title,
  subtitle,
  eyebrow = "TG MIPA Landshut",
  className = "",
  sheetClassName = DEFAULT_SHEET,
}: PageHeroSliderProps) {
  const [current, setCurrent] = useState(0);
  const prefersReduced = useReducedMotion() ?? false;
  const hasSlides = slides.length > 0;
  const fadeUp = heroFadeUp(prefersReduced, HERO_RISE_PX);

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
      className={`relative overflow-hidden min-h-[340px] md:min-h-[400px] lg:min-h-[500px] flex items-end ${className}`}
    >
      {/* ── Background layer ─────────────────────────────────────────── */}
      {hasSlides ? (
        <AnimatePresence initial={false}>
          <motion.div
            key={current}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: prefersReduced ? 0 : 0.9, ease: "easeInOut" }}
            className="absolute inset-0"
          >
            <Image
              src={urlFor(slides[current]).auto("format").url()}
              alt={slides[current].alt ?? ""}
              fill
              sizes="100vw"
              className="object-cover object-top"
              priority
              placeholder={slides[current].lqip ? "blur" : "empty"}
              blurDataURL={slides[current].lqip ?? undefined}
            />
          </motion.div>
        </AnimatePresence>
      ) : (
        /* Fallback: original accent-blue gradient when no slides are set */
        <div className="absolute inset-0 bg-gradient-to-br from-accent via-accent to-accent-deep" />
      )}

      {/* ── Gradient overlay: readable text on the left, photo stays visible ── */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-accent-dark/80 via-accent-dark/30 to-transparent" />
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-r from-accent-dark/70 via-accent-dark/25 to-transparent" />

      {/* ── Dark-mode dimming overlay ─────────────────────────────────── */}
      <div className="absolute inset-0 pointer-events-none opacity-0 dark:opacity-100 bg-black/25 transition-opacity duration-300" />

      {/* ── Title block ──────────────────────────────────────────────── */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 md:pb-20 pt-[132px] lg:pt-[140px] w-full">
        <motion.p
          custom={0}
          variants={fadeUp}
          initial="hidden"
          animate="show"
          className="text-xs font-semibold uppercase tracking-[0.12em] text-white/80 mb-3"
        >
          {eyebrow}
        </motion.p>
        <motion.h1
          custom={0.08}
          variants={fadeUp}
          initial="hidden"
          animate="show"
          className="font-display font-bold italic uppercase text-5xl md:text-6xl lg:text-7xl text-white tracking-[-0.03em] leading-[0.92] text-balance"
        >
          {title}
        </motion.h1>
        {subtitle && (
          <motion.p
            custom={0.2}
            variants={fadeUp}
            initial="hidden"
            animate="show"
            className="text-white/85 mt-4 text-base md:text-lg max-w-xl leading-relaxed"
          >
            {subtitle}
          </motion.p>
        )}
      </div>

      {/* ── Rounded sheet edge — same language as the landing page ───── */}
      <div
        aria-hidden="true"
        className={`absolute inset-x-0 bottom-0 h-8 md:h-12 sheet-top ${sheetClassName}`}
      />
    </section>
  );
}
