import * as React from "react"
import { cn } from "../lib/utils"

export interface ProgressBarProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number
  tone?: "brick" | "sage" | "ochre" | "clay" | "indigo"
  size?: "thin" | "md" | "thick"
}

const toneClasses = {
  brick: "bg-brick",
  sage: "bg-sage",
  ochre: "bg-ochre",
  clay: "bg-clay",
  indigo: "bg-indigo",
}

const sizeClasses = {
  thin: "h-1",
  md: "h-1.5",
  thick: "h-2.5",
}

const ProgressBar = React.forwardRef<HTMLDivElement, ProgressBarProps>(
  ({ className, value, tone = "brick", size = "md", ...props }, ref) => {
    const width = Math.min(100, Math.max(0, value))

    return (
      <div
        ref={ref}
        className={cn("w-full overflow-hidden rounded-full bg-surface-3", sizeClasses[size], className)}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={width}
        {...props}
      >
        <div className={cn("h-full rounded-full transition-all duration-500", toneClasses[tone])} style={{ width: `${width}%` }} />
      </div>
    )
  }
)
ProgressBar.displayName = "ProgressBar"

export { ProgressBar }
