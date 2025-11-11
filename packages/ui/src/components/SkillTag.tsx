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
      beginner: "bg-blue-100 text-blue-700",
      intermediate: "bg-green-100 text-green-700",
      expert: "bg-purple-100 text-purple-700",
    }

    return (
      <div
        ref={ref}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium transition-colors",
          level ? levelColors[level] : "bg-gray-100 text-gray-700",
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
            className="ml-1 rounded-full hover:bg-black/10 p-0.5 transition-colors"
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
