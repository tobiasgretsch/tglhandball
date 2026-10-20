import type { Variants } from "framer-motion";

/**
 * Hero headline entrance: rises by `distance` px, `custom` is the delay in seconds.
 * Opacity stays 1 because the headline is the LCP element and must be visible
 * in the server HTML and before hydration; only the rise is animated.
 */
export function heroFadeUp(reduced: boolean, distance: number): Variants {
  return {
    hidden: { opacity: 1, y: reduced ? 0 : distance },
    show: (delay: number) => ({
      opacity: 1,
      y: 0,
      transition: reduced
        ? { duration: 0 }
        : { type: "spring", bounce: 0, duration: 0.8, delay },
    }),
  };
}
