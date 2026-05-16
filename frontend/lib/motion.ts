import type { Transition, Variants } from "framer-motion";

/** Canonical easing curves — DESIGN-SYSTEM.md §8.1 */
export const ease = {
  out: [0.16, 1, 0.3, 1] as const,
  inOut: [0.65, 0, 0.35, 1] as const,
  outQuart: [0.25, 1, 0.5, 1] as const,
  outExpo: [0.16, 1, 0.3, 1] as const,
  outBack: [0.34, 1.56, 0.64, 1] as const,
};

export const spring: Transition = {
  type: "spring",
  stiffness: 220,
  damping: 26,
  mass: 0.9,
};

export const springSnappy: Transition = {
  type: "spring",
  stiffness: 400,
  damping: 24,
};

export const dur = {
  instant: 0.08,
  fast: 0.16,
  base: 0.24,
  slow: 0.4,
  epic: 0.7,
};

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: dur.slow, ease: ease.outExpo },
  },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: dur.base, ease: ease.out } },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  show: {
    opacity: 1,
    scale: 1,
    transition: { duration: dur.base, ease: ease.outExpo },
  },
};

export const stagger = (gap = 0.08, delay = 0.05): Variants => ({
  hidden: {},
  show: { transition: { staggerChildren: gap, delayChildren: delay } },
});

export const slideInFromRight: Variants = {
  hidden: { x: "100%" },
  show: { x: 0, transition: { duration: dur.slow, ease: ease.outExpo } },
  exit: { x: "100%", transition: { duration: dur.base, ease: ease.out } },
};

export const slideUpSheet: Variants = {
  hidden: { y: "100%" },
  show: { y: 0, transition: { duration: dur.slow, ease: ease.outExpo } },
  exit: { y: "100%", transition: { duration: dur.base } },
};

export const modal: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  show: {
    opacity: 1,
    scale: 1,
    transition: { duration: dur.base, ease: ease.outExpo },
  },
  exit: { opacity: 0, scale: 0.96, transition: { duration: dur.fast } },
};

export const buttonTap = {
  whileTap: { scale: 0.98 },
  whileHover: { y: -1 },
  transition: { duration: dur.fast, ease: ease.out },
};

export const viewportOnce = { once: true, amount: 0.25 } as const;
