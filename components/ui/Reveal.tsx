"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

interface RevealProps {
  children: ReactNode;
  /** Stagger delay in seconds — use for sibling items, not whole sections. */
  delay?: number;
  className?: string;
}

/**
 * Scroll-reveal wrapper. Content is server-rendered and visible without JS;
 * the animation only enhances. Respects prefers-reduced-motion (instant).
 */
export default function Reveal({ children, delay = 0, className }: RevealProps) {
  const reduced = useReducedMotion() ?? false;

  return (
    <motion.div
      className={className}
      initial={reduced ? false : { opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{
        duration: 0.6,
        ease: [0.22, 1, 0.36, 1],
        delay: reduced ? 0 : delay,
      }}
    >
      {children}
    </motion.div>
  );
}
