"use client";

import { motion } from "framer-motion";
import * as React from "react";

/**
 * React Bits-style text reveal (blur -> crisp).
 * Drop-in, no external setup required.
 */
export function BlurText({
  children,
  className = "",
  delay = 0.15,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.span
      initial={{ filter: "blur(12px)", opacity: 0.0, y: 6 }}
      animate={{ filter: "blur(0px)", opacity: 1, y: 0 }}
      transition={{ duration: 0.9, delay, ease: [0.2, 0.8, 0.2, 1] }}
      className={className}
    >
      {children}
    </motion.span>
  );
}
