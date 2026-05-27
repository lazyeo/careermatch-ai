import * as React from "react"
import { cn } from "../lib/utils"

export interface ScoreRingProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number
  label?: string
  size?: number
  stroke?: number
  tone?: "brick" | "sage" | "ochre" | "clay" | "indigo"
}

const toneVars = {
  brick: "var(--brick)",
  sage: "var(--sage)",
  ochre: "var(--ochre)",
  clay: "var(--clay)",
  indigo: "var(--indigo)",
}

const ScoreRing = React.forwardRef<HTMLDivElement, ScoreRingProps>(
  ({ className, value, label, size = 112, stroke = 10, tone = "brick", ...props }, ref) => {
    const normalized = Math.min(100, Math.max(0, value))
    const radius = (size - stroke) / 2
    const circumference = 2 * Math.PI * radius
    const offset = circumference - (normalized / 100) * circumference

    return (
      <div ref={ref} className={cn("relative inline-grid place-items-center", className)} style={{ width: size, height: size }} {...props}>
        <svg width={size} height={size} className="-rotate-90" aria-hidden>
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--surface-3)" strokeWidth={stroke} />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={toneVars[tone]}
            strokeLinecap="round"
            strokeWidth={stroke}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-[stroke-dashoffset] duration-700"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-4xl leading-none text-ink">{normalized}</span>
          {label && <span className="mt-1 text-xs text-ink-3">{label}</span>}
        </div>
      </div>
    )
  }
)
ScoreRing.displayName = "ScoreRing"

export { ScoreRing }
