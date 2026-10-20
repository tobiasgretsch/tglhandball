"use client";

import Link from "next/link";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Newspaper } from "lucide-react";
import { heroFadeUp } from "@/lib/motion";

interface HeroSectionProps {
  heroImageUrl: string | null;
  heroImageBlurDataURL?: string;
  clubName: string;
}

const HERO_RISE_PX = 28;

export default function HeroSection({ heroImageUrl, heroImageBlurDataURL, clubName }: HeroSectionProps) {
  const prefersReduced = useReducedMotion() ?? false;
  const fadeUp = heroFadeUp(prefersReduced, HERO_RISE_PX);

  return (
    <section className="relative min-h-dvh flex items-end" aria-labelledby="hero-heading">
      {/* Fixed background — stays in place while content scrolls over it.
          Uses dvh (dynamic viewport height) so the image fills exactly the
          visible area including safe-area insets, without overflowing behind
          the browser taskbar or home indicator on mobile. */}
      <div className="fixed top-0 left-0 right-0 h-dvh -z-10 bg-accent">
        {heroImageUrl ? (
          <Image
            src={heroImageUrl}
            alt={clubName}
            fill
            priority
            sizes="100vw"
            className="object-cover"
            placeholder={heroImageBlurDataURL ? "blur" : "empty"}
            blurDataURL={heroImageBlurDataURL}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-accent-deep via-accent to-accent-dark" />
        )}
        {/* Dark gradient overlay — stronger at bottom */}
        <div className="absolute inset-0 bg-gradient-to-t from-accent-dark/85 via-black/20 to-black/10" />
      </div>

      {/* Content */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24 pt-40 w-full" style={{ paddingBottom: "max(6rem, calc(6rem + env(safe-area-inset-bottom)))" }}>
        <motion.p
          custom={0}
          variants={fadeUp}
          initial="hidden"
          animate="show"
          aria-hidden="true"
          className="inline-block bg-primary text-white font-display font-bold italic uppercase text-base sm:text-lg px-4 py-1 -skew-x-12 mb-6"
        >
          <span className="inline-block skew-x-12">TG MIPA Landshut</span>
        </motion.p>

        <motion.h1
          id="hero-heading"
          custom={0.1}
          variants={fadeUp}
          initial="hidden"
          animate="show"
          className="font-display font-bold italic text-6xl sm:text-7xl md:text-8xl text-white uppercase tracking-[-0.03em] leading-[0.88] mb-6"
        >
          <span className="sr-only">TG MIPA Landshut: </span>
          Handball
          <br />
          <span className="text-primary-glow">in Landshut</span>
        </motion.h1>

        <motion.p
          custom={0.25}
          variants={fadeUp}
          initial="hidden"
          animate="show"
          className="text-white/85 text-lg md:text-xl font-normal max-w-xl mb-10 leading-relaxed"
        >
          TG MIPA Landshut — Leidenschaft seit Jahrzehnten.
        </motion.p>

        <motion.div
          custom={0.4}
          variants={fadeUp}
          initial="hidden"
          animate="show"
          className="flex flex-wrap gap-4"
        >
          <Link
            href="/news"
            className="btn btn-primary"
          >
            <Newspaper size={16} aria-hidden="true" />
            Neuigkeiten
          </Link>
          <Link
            href="/teams"
            className="btn btn-glass"
          >
            Zu den Teams
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
