import * as React from "react"
import { cn } from "../lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: "neutral" | "brick" | "sage" | "ochre" | "clay" | "indigo" | "ghost"
  plain?: boolean
}

const toneClasses = {
  neutral: "bg-surface-2 text-ink-2",
  brick: "bg-brick-soft text-brick-ink",
  sage: "bg-sage-soft text-sage",
  ochre: "bg-ochre-soft text-ochre",
  clay: "bg-clay-soft text-clay",
  indigo: "bg-indigo-soft text-indigo",
  ghost: "border-line-2 bg-transparent text-ink-3",
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, tone = "neutral", plain = false, children, ...props }, ref) => (
    <span
      ref={ref}
      className={cn(
        "inline-flex h-6 items-center gap-1.5 rounded-full border border-transparent px-2.5 text-xs font-medium tracking-normal",
        toneClasses[tone],
        className
      )}
      {...props}
    >
      {!plain && <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" aria-hidden />}
      {children}
    </span>
  )
)
Badge.displayName = "Badge"

export { Badge }
