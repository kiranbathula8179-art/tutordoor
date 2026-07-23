import { motion } from "framer-motion";
import type { ReactNode } from "react";

import { fadeRise } from "@/lib/motion/tokens";
import { prefersReducedMotion } from "@/lib/motion/quality";

/** Shared eyebrow + title pattern for every landing section. */
export function SectionHeading({ eyebrow, title }: { eyebrow: string; title: ReactNode }) {
  const still = prefersReducedMotion();
  return (
    <motion.div
      initial={still ? false : "hidden"}
      whileInView="show"
      viewport={{ once: true, margin: "-60px" }}
      variants={fadeRise}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">{eyebrow}</p>
      <h2 className="mt-2 max-w-2xl font-display text-3xl font-bold tracking-tight text-navy sm:text-4xl">
        {title}
      </h2>
    </motion.div>
  );
}
