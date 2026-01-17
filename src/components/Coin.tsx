"use client"

import Image from "next/image"
import * as React from "react"
import { motion, useAnimationControls } from "framer-motion"

export type Face = "heads" | "tails"

type Props = {
  face: Face
  flipping: boolean
  onFlipComplete?: (face: Face) => void
  requestFlipNonce: number
}

// --- Timing / feel ---
const IDLE_ROTATE_SEC = 4.2

// Total flip duration (seconds)
const FLIP_TOTAL_SEC = 1.0

// Portion of time spent in the "very fast" part (0..1)
const FLIP_FAST_PHASE = 0.28

// Spins during flip (higher = faster)
const FLIP_SPINS = 22

// Thickness tuning
const EDGE_SLICES = 18
const THICKNESS_PX = 18
const TILT_X_DEG = 74

function mod(n: number, m: number) {
  return ((n % m) + m) % m
}

export function Coin({ onFlipComplete, requestFlipNonce }: Props) {
  const controls = useAnimationControls()

  // used only to force next/image to refresh if needed
  const [seed, setSeed] = React.useState(0)

  // track current angle so flip starts from wherever idle currently is
  const currentYRef = React.useRef(0)

  // gate flips so mid-flip clicks do nothing (UI already disables, this is extra safety)
  const animatingRef = React.useRef(false)

  // "Have we ever flipped?" -> after first flip, coin stays static until next flip
  const hasFlippedRef = React.useRef(false)

  // Idle spin: only before the first flip, or if you reset by setting flipNonce back to 0
  React.useEffect(() => {
    if (requestFlipNonce === 0) {
      hasFlippedRef.current = false
      animatingRef.current = false

      // start slow idle loop
      requestAnimationFrame(() => {
        void controls.start({
          rotateY: 360,
          transition: {
            duration: IDLE_ROTATE_SEC,
            ease: "linear",
            repeat: Infinity,
            repeatType: "loop",
          },
        })
      })
    } else {
      // after first flip, do NOT auto-restart idle (state 3)
      if (hasFlippedRef.current) {
        controls.stop()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestFlipNonce])

  // Flip trigger: starts whenever requestFlipNonce increments (>0)
  React.useEffect(() => {
    if (requestFlipNonce <= 0) return
    if (animatingRef.current) return

    animatingRef.current = true
    hasFlippedRef.current = true

    // stop any idle loop cleanly
    controls.stop()

    // Random outcome (crypto if available)
    const rand =
      typeof crypto !== "undefined" && crypto.getRandomValues
        ? crypto.getRandomValues(new Uint32Array(1))[0]
        : Math.floor(Math.random() * 2 ** 32)

    const nextFace: Face = rand % 2 === 0 ? "heads" : "tails"
    const landing = nextFace === "heads" ? 0 : 180

    // current angle, normalized
    const start = currentYRef.current
    const startMod = mod(start, 360)

    // delta needed so final ends exactly on landing (0 or 180)
    const landingDelta = mod(landing - startMod, 360)

    // total rotation distance
    const totalDelta = FLIP_SPINS * 360 + landingDelta
    const end = start + totalDelta

    // Make it "super fast" early, then slow down:
    // - cover ~75% of the distance in the fast phase, then glide to finish
    const mid = start + totalDelta * 0.78

    setSeed((s) => s + 1)

    void controls
      .start({
        rotateY: [start, mid, end],
        transition: {
          duration: FLIP_TOTAL_SEC,
          times: [0, FLIP_FAST_PHASE, 1],
          // segment 1: snaps into speed quickly
          // segment 2: slows down and settles
          ease: ["easeOut", "easeOut"],
        },
      })
      .then(() => {
        // lock to exact final angle so it's static in state 3
        void controls.set({ rotateY: end })

        animatingRef.current = false
        onFlipComplete?.(nextFace)
      })

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestFlipNonce])

  // Edge slices (thickness)
  const slices = React.useMemo(() => {
    const out: { key: number; z: number; opacity: number }[] = []
    const half = THICKNESS_PX / 2
    for (let i = 0; i < EDGE_SLICES; i++) {
      const t = EDGE_SLICES === 1 ? 0.5 : i / (EDGE_SLICES - 1)
      const z = -half + t * THICKNESS_PX
      const opacity = 0.22 + 0.26 * Math.sin(t * Math.PI)
      out.push({ key: i, z, opacity })
    }
    return out
  }, [])

  return (
    <div className="relative w-[240px] h-[240px] sm:w-[300px] sm:h-[300px] md:w-[340px] md:h-[340px]">
      <motion.div
        className="relative h-full w-full"
        animate={controls}
        initial={{ rotateY: 0 }}
        // capture current angle continuously so flip starts from the current position
        onUpdate={(latest) => {
          const v = (latest as any)?.rotateY
          if (typeof v === "number" && Number.isFinite(v)) currentYRef.current = v
        }}
        style={{
          transformStyle: "preserve-3d",
          transform: `rotateX(${TILT_X_DEG}deg)`,
          willChange: "transform",
        }}
      >
        {/* EDGE / THICKNESS */}
        {slices.map(({ key, z, opacity }) => (
          <div
            key={key}
            className="absolute inset-0 rounded-full"
            style={{
              transform: `translateZ(${z}px) scale(1.001)`,
              background:
                "linear-gradient(135deg, rgba(212,175,55,.92), rgba(255,238,196,.78), rgba(212,175,55,.92))",
              opacity,
              boxShadow:
                "inset 0 0 0 1px rgba(212,175,55,.22), inset 0 0 0 6px rgba(255,244,214,.06)",
              backfaceVisibility: "visible",
              pointerEvents: "none",
            }}
          />
        ))}

        {/* FRONT */}
        <div
          className="absolute inset-0 rounded-full overflow-hidden"
          style={{
            backfaceVisibility: "hidden",
            transform: `rotateY(0deg) translateZ(${THICKNESS_PX / 2 + 1}px)`,
          }}
        >
          <Image
            key={"h-" + seed}
            src="/images/heads.png"
            alt="Heads"
            fill
            priority
            className="object-contain"
          />
        </div>

        {/* BACK */}
        <div
          className="absolute inset-0 rounded-full overflow-hidden"
          style={{
            backfaceVisibility: "hidden",
            transform: `rotateY(180deg) translateZ(${THICKNESS_PX / 2 + 1}px)`,
          }}
        >
          <Image
            key={"t-" + seed}
            src="/images/tails.png"
            alt="Tails"
            fill
            priority
            className="object-contain"
          />
        </div>
      </motion.div>
    </div>
  )
}