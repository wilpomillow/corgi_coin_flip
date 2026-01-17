"use client";

import * as React from "react";

/**
 * React Bits-style border with subtle orbital sparkles.
 * Implemented with pure CSS for mobile friendliness.
 */
export function StarBorder({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={"relative rounded-[28px] p-[1px] " + className}>
      <div className="absolute inset-0 rounded-[28px] bg-[linear-gradient(135deg,rgba(212,175,55,.65),rgba(255,244,214,.35),rgba(212,175,55,.45))] opacity-70" />
      <div className="absolute inset-0 rounded-[28px] overflow-hidden">
        <div className="orbital" />
      </div>
      <div className="relative rounded-[27px] bg-white/80 backdrop-blur-xl border border-[#e9dfc2] shadow-[0_30px_90px_rgba(0,0,0,.10)]">
        {children}
      </div>
      <style jsx>{`
        .orbital {
          position: absolute;
          inset: -30%;
          background:
            radial-gradient(circle at 20% 30%, rgba(212,175,55,.55), rgba(212,175,55,0) 38%),
            radial-gradient(circle at 65% 70%, rgba(255,238,196,.65), rgba(255,238,196,0) 42%),
            radial-gradient(circle at 78% 28%, rgba(212,175,55,.35), rgba(212,175,55,0) 34%);
          filter: blur(0.2px);
          animation: orbit 10s linear infinite;
          opacity: 0.75;
        }
        @keyframes orbit {
          0% { transform: rotate(0deg) scale(1); }
          50% { transform: rotate(180deg) scale(1.02); }
          100% { transform: rotate(360deg) scale(1); }
        }
        @media (prefers-reduced-motion: reduce) {
          .orbital { animation: none; }
        }
      `}</style>
    </div>
  );
}
