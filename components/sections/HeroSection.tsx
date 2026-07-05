"use client";

import Link from "next/link";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Newspaper } from "lucide-react";

interface HeroSectionProps {
  heroImageUrl: string | null;
  heroImageBlurDataURL?: string;
  clubName: string;
}

function makeFadeUp(reduced: boolean) {
  return {
    hidden: { opacity: 0, y: reduced ? 0 : 28 },
    show: (delay: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        duration: reduced ? 0 : 0.7,
        ease: "easeOut" as const,
        delay: reduced ? 0 : delay,
      },
    }),
  };
}

export default function HeroSection({ heroImageUrl, heroImageBlurDataURL, clubName }: HeroSectionProps) {
  const prefersReduced = useReducedMotion() ?? false;
  const fadeUp = makeFadeUp(prefersReduced);

  return (
<<<<<<< Updated upstream
    <section className="relative min-h-screen flex items-end">
=======
    <section className="relative min-h-dvh flex items-end" aria-labelledby="hero-heading">
>>>>>>> Stashed changes
      {/* Fixed background — stays in place while content scrolls over it.
          Uses top/left/right + h-screen (100vh) instead of inset-0 so the
          container height is locked to the initial layout viewport. This
          prevents iOS Safari from rescaling the image when the browser chrome
          hides/shows during scroll (the "zoom" effect on mobile). */}
      <div className="fixed top-0 left-0 right-0 h-screen -z-10 bg-accent">
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
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/10" />
      </div>

      {/* Content */}
<<<<<<< Updated upstream
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 pt-40 w-full">
=======
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-40 w-full" style={{ paddingBottom: "calc(8rem + env(safe-area-inset-bottom, 0px))" }}>
>>>>>>> Stashed changes
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
          className="font-display font-bold italic text-6xl sm:text-7xl md:text-8xl text-white uppercase tracking-tight leading-[0.88] mb-6"
        >
          Handball
          <br />
          <span className="text-primary-glow">in Landshut</span>
        </motion.h1>

        <motion.p
          custom={0.25}
          variants={fadeUp}
          initial="hidden"
          animate="show"
          className="text-white/65 text-lg md:text-xl font-light max-w-xl mb-10 leading-relaxed"
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
            className="inline-flex items-center gap-2 bg-primary hover:bg-primary-light text-white font-bold uppercase tracking-widest text-[13px] px-7 py-4 rounded-sm transition-colors shadow-lg shadow-primary/30"
          >
            <Newspaper size={16} />
            Neuigkeiten
          </Link>
          <Link
            href="/teams"
            className="inline-flex items-center gap-2 border-2 border-white/40 hover:border-white text-white font-bold uppercase tracking-widest text-[13px] px-7 py-4 rounded-sm transition-colors hover:bg-white/10"
          >
            Zu den Teams
            <ArrowRight size={16} />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
