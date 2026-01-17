"use client";

import { X } from "lucide-react";
import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";

export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-50 grid place-items-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <button
            className="absolute inset-0 bg-black/35 backdrop-blur-[2px]"
            aria-label="Close modal"
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className="relative w-full max-w-lg rounded-3xl border border-[#eadfbd] bg-white/90 backdrop-blur-xl shadow-[0_40px_120px_rgba(0,0,0,.22)]"
            initial={{ y: 14, scale: 0.98, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 12, scale: 0.98, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.2, 0.8, 0.2, 1] }}
          >
            <div className="flex items-center justify-between px-6 pt-5">
              <div className="text-base font-semibold tracking-tight text-[#2f281b]">
                {title}
              </div>
              <button
                onClick={onClose}
                aria-label="Close"
                className="h-10 w-10 rounded-full grid place-items-center border border-[#eadfbd] bg-white/60 hover:bg-white transition"
              >
                <X className="h-5 w-5 text-[#2f281b]" />
              </button>
            </div>
            <div className="px-6 pb-6 pt-4 text-sm leading-relaxed text-[#3b3324]">
              {children}
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
