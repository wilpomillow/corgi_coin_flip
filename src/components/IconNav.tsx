"use client";

import { Info, Moon, Sun, RotateCcw } from "lucide-react";
import * as React from "react";

export type NavAction = "flip" | "reset" | "theme" | "info";

export function IconNav({
  onAction,
  disabledFlip,
  theme,
}: {
  onAction: (a: NavAction) => void;
  disabledFlip: boolean;
  theme: "light" | "warm";
}) {
  return (
    <div className="pointer-events-auto flex items-center justify-center gap-3">
      <IconButton
        label="Flip"
        onClick={() => onAction("flip")}
        disabled={disabledFlip}
      >
        <RotateCcw className="h-5 w-5" />
      </IconButton>

      <IconButton label="Reset" onClick={() => onAction("reset")}>
        <span className="text-[11px] font-semibold tracking-wide">0</span>
      </IconButton>

      <IconButton label={theme === "light" ? "Warm" : "Light"} onClick={() => onAction("theme")}>
        {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
      </IconButton>

      <IconButton label="Info" onClick={() => onAction("info")}>
        <Info className="h-5 w-5" />
      </IconButton>
    </div>
  );
}

function IconButton({
  children,
  label,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={[
        "relative group h-11 w-11 rounded-full",
        "border border-[#e7ddc0] bg-white/75 backdrop-blur-md",
        "shadow-[0_12px_30px_rgba(0,0,0,.10)]",
        "transition-transform active:scale-[0.98] hover:-translate-y-[1px]",
        "disabled:opacity-50 disabled:hover:translate-y-0 disabled:active:scale-100",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d4af37]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-white/70",
      ].join(" ")}
    >
      {/* <div className="absolute inset-0 rounded-full shimmer-line opacity-0 group-hover:opacity-100 transition-opacity" /> */}
      <span className="relative grid place-items-center text-[#3d3423]">{children}</span>
      <span className="sr-only">{label}</span>
    </button>
  );
}
