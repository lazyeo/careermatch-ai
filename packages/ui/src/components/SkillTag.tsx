import * as React from "react"
import { cn } from "../lib/utils"
import { X } from "lucide-react"

export interface SkillTagProps extends React.HTMLAttributes<HTMLDivElement> {
  skill: string
  level?: "beginner" | "intermediate" | "expert"
  onRemove?: () => void
  removable?: boolean
}

const SkillTag = React.forwardRef<HTMLDivElement, SkillTagProps>(
  ({ className, skill, level, onRemove, removable = false, ...props }, ref) => {
    const levelColors = {
      beginner: "bg-indigo-soft text-indigo",
      intermediate: "bg-sage-soft text-sage",
      expert: "bg-brick-soft text-brick-ink",
    }

    return (
      <div
        ref={ref}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium tracking-normal transition-colors",
          level ? levelColors[level] : "bg-surface-2 text-ink-2",
          className
        )}
        {...props}
      >
        <span>{skill}</span>
        {level && (
          <span className="text-xs opacity-70">
            {level === "beginner" && "•"}
            {level === "intermediate" && "••"}
            {level === "expert" && "•••"}
          </span>
        )}
        {removable && onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="ml-1 rounded-full p-0.5 transition-colors hover:bg-black/10"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>
    )
  }
)
SkillTag.displayName = "SkillTag"

export { SkillTag }
