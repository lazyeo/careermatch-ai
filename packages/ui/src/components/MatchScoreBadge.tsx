import * as React from "react"
import { cn } from "../lib/utils"

export interface MatchScoreBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  score: number // 0-100
  size?: "sm" | "md" | "lg"
  showLabel?: boolean
}

const MatchScoreBadge = React.forwardRef<HTMLDivElement, MatchScoreBadgeProps>(
  ({ className, score, size = "md", showLabel = true, ...props }, ref) => {
    const getColor = (score: number) => {
      if (score >= 80) return "text-sage bg-sage-soft border-transparent"
      if (score >= 60) return "text-indigo bg-indigo-soft border-transparent"
      if (score >= 40) return "text-ochre bg-ochre-soft border-transparent"
      return "text-clay bg-clay-soft border-transparent"
    }

    const sizeClasses = {
      sm: "text-xs px-2 py-1",
      md: "text-sm px-3 py-1.5",
      lg: "text-base px-4 py-2",
    }

    return (
      <div
        ref={ref}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border font-semibold",
          getColor(score),
          sizeClasses[size],
          className
        )}
        {...props}
      >
        <span>{score}%</span>
        {showLabel && <span className="font-normal">Match</span>}
      </div>
    )
  }
)
MatchScoreBadge.displayName = "MatchScoreBadge"

export { MatchScoreBadge }
