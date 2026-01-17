"use client"

import * as React from "react"
import Image from "next/image"
import { Coin, Face } from "@/components/Coin"
import { IconNav, NavAction } from "@/components/IconNav"
import { Modal } from "@/components/Modal"

const PING_URL = "/sounds/coin-ping.wav"

// Your WAV has ~87ms of leading silence; start slightly in for instant perceived playback.
const PING_START_OFFSET_SEC = 0.09

export default function Page() {
  const [theme, setTheme] = React.useState<"light" | "warm">("light")
  const [face, setFace] = React.useState<Face>("heads")
  const [flipping, setFlipping] = React.useState(false)
  const [flipNonce, setFlipNonce] = React.useState(0)
  const [openInfo, setOpenInfo] = React.useState(false)

  // Force-remount Coin on reset so idle always restarts from a clean state (slow).
  const [coinKey, setCoinKey] = React.useState(0)

  // --- Low-latency sound via Web Audio ---
  const audioCtxRef = React.useRef<AudioContext | null>(null)
  const pingBufRef = React.useRef<AudioBuffer | null>(null)
  const pingLoadingRef = React.useRef<Promise<void> | null>(null)

  // Prevent double-trigger when using pointerdown + click fallback
  const lastPointerFlipAtRef = React.useRef<number>(0)

  const getCtx = React.useCallback(() => {
    const Ctx = (window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext
    if (!audioCtxRef.current) audioCtxRef.current = new Ctx()
    return audioCtxRef.current
  }, [])

  const ensurePingLoaded = React.useCallback(async () => {
    if (pingBufRef.current) return
    if (pingLoadingRef.current) return pingLoadingRef.current

    pingLoadingRef.current = (async () => {
      const ctx = getCtx()
      const res = await fetch(PING_URL, { cache: "force-cache" })
      const arr = await res.arrayBuffer()
      pingBufRef.current = await ctx.decodeAudioData(arr)
    })()

    return pingLoadingRef.current
  }, [getCtx])

  const playPingNow = React.useCallback(() => {
    const ctx = audioCtxRef.current
    const buf = pingBufRef.current
    if (!ctx || !buf) return

    const src = ctx.createBufferSource()
    src.buffer = buf
    src.connect(ctx.destination)

    const offset = Math.min(PING_START_OFFSET_SEC, Math.max(0, (buf.duration ?? 0) - 0.01))
    src.start(0, offset)
  }, [])

  // Start fetching/decoding ASAP
  React.useEffect(() => {
    void ensurePingLoaded()
  }, [ensurePingLoaded])

  // Prime AudioContext on first user interaction so subsequent flips are instant.
  React.useEffect(() => {
    const prime = () => {
      const ctx = getCtx()
      void (async () => {
        try {
          if (ctx.state === "suspended") await ctx.resume()
          await ensurePingLoaded()
        } catch {
          // ignore
        }
      })()
      window.removeEventListener("pointerdown", prime, { capture: true } as any)
    }

    window.addEventListener("pointerdown", prime, { capture: true, passive: true })
    return () => window.removeEventListener("pointerdown", prime, { capture: true } as any)
  }, [ensurePingLoaded, getCtx])

  const resetToIdle = React.useCallback(() => {
    if (flipping) return

    setOpenInfo(false)
    setFace("heads")

    // ✅ this is the "preflip idle" state that Coin.tsx listens for
    setFlipNonce(0)

    // ✅ ensures Coin's motion state fully resets so idle is slow, not "catching up"
    setCoinKey((k) => k + 1)
  }, [flipping])

  // Trigger audio first, then initiate flip on the next animation frame.
  const triggerFlip = React.useCallback(() => {
    if (flipping) return

    const ctx = getCtx()

    const kickAudio = () => {
      if (pingBufRef.current && ctx.state === "running") {
        playPingNow()
        return
      }

      void (async () => {
        try {
          if (ctx.state === "suspended") await ctx.resume()
          await ensurePingLoaded()
          playPingNow()
        } catch {
          // ignore
        }
      })()
    }

    kickAudio()

    requestAnimationFrame(() => {
      setFlipping((is) => {
        if (is) return is
        setFlipNonce((n) => n + 1)
        return true
      })
    })
  }, [ensurePingLoaded, flipping, getCtx, playPingNow])

  // Use pointerdown to shave off the browser click delay.
  const triggerFlipPointer = React.useCallback(() => {
    lastPointerFlipAtRef.current = Date.now()
    triggerFlip()
  }, [triggerFlip])

  // Keyboard / accessibility fallback (avoid double fire after pointerdown)
  const triggerFlipClick = React.useCallback(() => {
    const dt = Date.now() - lastPointerFlipAtRef.current
    if (dt >= 0 && dt < 450) return
    triggerFlip()
  }, [triggerFlip])

  function doAction(a: NavAction) {
    if (a === "flip") {
      triggerFlip()
      return
    }
    if (a === "reset") {
      resetToIdle()
      return
    }
    if (a === "theme") {
      setTheme((t) => (t === "light" ? "warm" : "light"))
      return
    }
    if (a === "info") {
      setOpenInfo(true)
    }
  }

  return (
    <main
      className={[
        "relative min-h-screen overflow-hidden",
        theme === "light" ? "bg-[#fbfaf6]" : "bg-[#f8f1df]",
      ].join(" ")}
    >
      {/* Background */}
      <div className="absolute inset-0 grain">
        <div
          className="absolute inset-0"
          style={{
            background:
              theme === "light"
                ? "radial-gradient(900px 500px at 20% 10%, rgba(255,244,214,.95), rgba(255,244,214,0) 65%), radial-gradient(900px 500px at 80% 80%, rgba(212,175,55,.22), rgba(212,175,55,0) 70%), linear-gradient(180deg, rgba(255,255,255,.65), rgba(255,255,255,0))"
                : "radial-gradient(900px 500px at 20% 10%, rgba(255,238,196,.92), rgba(255,238,196,0) 66%), radial-gradient(900px 500px at 70% 75%, rgba(212,175,55,.25), rgba(212,175,55,0) 70%), linear-gradient(180deg, rgba(255,255,255,.55), rgba(255,255,255,0))",
          }}
        />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center px-5 py-10">
        {/* Title (click to reset to slow idle) */}
        <div className="mt flex justify-center">
          <button
            type="button"
            aria-label="Reset coin to idle"
            onClick={resetToIdle}
            disabled={flipping}
            className={[
              "rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d4af37]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-white/70",
              flipping ? "cursor-not-allowed opacity-70" : "cursor-pointer",
            ].join(" ")}
          >
            <Image
              src="/images/title.png"
              alt="Corgi Coin Flip"
              width={520}
              height={160}
              priority
              className="max-h-[150px] w-auto object-contain"
            />
          </button>
        </div>

        {/* Content */}
        <div className="mt-10 w-full">
          <div className="mx-auto flex max-w-2xl flex-col items-center gap-8 px-2 sm:px-6">
            {/* Clickable coin */}
            <button
              type="button"
              onPointerDown={triggerFlipPointer}
              onClick={triggerFlipClick}
              disabled={flipping}
              aria-label="Flip coin"
              className={[
                "select-none rounded-full",
                flipping ? "cursor-not-allowed" : "cursor-pointer",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d4af37]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-white/70",
              ].join(" ")}
            >
              <Coin
                key={coinKey}
                face={face}
                flipping={flipping}
                requestFlipNonce={flipNonce}
                onFlipComplete={(f) => {
                  setFace(f)
                  setFlipping(false)
                }}
              />
            </button>
              <div className="text-m text-[#3b3324]/70">
                Result:{" "}
                <span className="font-semibold text-[#2b2418]">{face === "heads" ? "Heads" : "Tails"}</span>
              </div>
            <div className="flex flex-col items-center gap-4">
              <button
                type="button"
                onPointerDown={triggerFlipPointer}
                onClick={triggerFlipClick}
                disabled={flipping}
                className={[
                  "rounded-full px-10 py-4 text-sm sm:text-base font-semibold tracking-wide",
                  "border border-[#d4af37]/55 bg-[#fff8e3] text-[#2b2418]",
                  "shadow-[0_18px_60px_rgba(0,0,0,.14)]",
                  "transition-transform hover:-translate-y-[1px] active:scale-[0.99]",
                  "disabled:opacity-50 disabled:hover:translate-y-0 disabled:active:scale-100",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d4af37]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-white/70",
                ].join(" ")}
              >
                {flipping ? "Flipping…" : "Flip again"}
              </button>



              <div className="mt-2">
                <IconNav onAction={doAction} disabledFlip={flipping} theme={theme} />
              </div>
            </div>
          </div>
        </div>

        <footer className="mt-10 text-center text-xs text-[#3b3324]/60">
          Copyright © 2026 Wilpo Millow. All rights reserved.
        </footer>
      </div>

      <Modal open={openInfo} onClose={() => setOpenInfo(false)} title="About this app">
        <ul className="list-disc pl-5 space-y-2">
          <li>Pointer-down starts the sound immediately (audio-first), then the flip begins next frame.</li>
          <li>Click the header title to reset back to the slow idle rotation state.</li>
          <li>Flip is disabled while mid-flip.</li>
        </ul>
      </Modal>
      {/* Pet Circle Insurance Banner */}
<div className="relative z-10 w-full border-t border-[#eadfbd] bg-white/70 backdrop-blur-sm">
  <a
    href="https://www.petcircleinsurance.com.au/"
    target="_blank"
    rel="noopener noreferrer"
    className="mx-auto flex max-w-5xl flex-col items-center gap-3 px-4 py-5 text-center sm:flex-row sm:justify-center sm:gap-6"
  >
    <Image
      src="/images/petcircleinsurance.png"
      alt="Pet Circle Insurance"
      width={220}
      height={80}
      className="max-h-[56px] w-auto object-contain"
    />

    <span className="text-sm sm:text-base font-medium text-[#2b2418]">
      Don&apos;t take a chance on your pets.{" "}
      <span className="font-semibold">Get insured with Pet Circle</span>
    </span>
  </a>
</div>

    </main>
  )
}
