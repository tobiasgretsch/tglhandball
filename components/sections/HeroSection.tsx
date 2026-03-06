"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRight, Calendar } from "lucide-react";

interface HeroSectionProps {
  heroImageUrl: string | null;
  clubName: string;
}

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: (delay: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: "easeOut" as const, delay },
  }),
};

export default function HeroSection({ heroImageUrl, clubName }: HeroSectionProps) {
  return (
    <section className="relative min-h-screen flex items-end">
      {/* Fixed background — stays in place while content scrolls over it */}
      <div className="fixed inset-0 -z-10 bg-accent">
        {heroImageUrl ? (
          <Image
            src={heroImageUrl}
            alt={clubName}
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#003a7a] via-accent to-[#001f4d]" />
        )}
        {/* Dark gradient overlay — stronger at bottom */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/10" />
      </div>

      {/* Content */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 pt-40 w-full">
        <motion.p
          custom={0}
          variants={fadeUp}
          initial="hidden"
          animate="show"
          className="text-[11px] font-bold uppercase tracking-[0.3em] text-white/55 mb-5"
        >
          TG MIPA Landshut
        </motion.p>

        <motion.h1
          custom={0.1}
          variants={fadeUp}
          initial="hidden"
          animate="show"
          className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-white uppercase tracking-tight leading-[0.9] mb-6"
        >
          Handball
          <br />
          <span className="text-primary">in Landshut</span>
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
            href="/spielplan"
            className="inline-flex items-center gap-2 bg-primary hover:bg-primary-light text-white font-bold uppercase tracking-widest text-[13px] px-7 py-4 rounded-sm transition-colors shadow-lg shadow-primary/30"
          >
            <Calendar size={16} />
            Nächstes Spiel
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
