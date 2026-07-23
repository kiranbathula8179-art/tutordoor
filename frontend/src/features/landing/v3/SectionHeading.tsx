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
      <p className="text-xs font-bold uppercase tracking-[0.22em] text-primary">{eyebrow}</p>
      <h2 className="mt-2.5 max-w-2xl font-display text-3xl font-bold tracking-[-0.02em] text-navy sm:text-4xl lg:text-[2.75rem]">
        {title}
      </h2>
    </motion.div>
  );
}
