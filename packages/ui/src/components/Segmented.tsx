import * as React from "react"
import { cn } from "../lib/utils"

export interface SegmentedOption {
  value: string
  label: React.ReactNode
}

export interface SegmentedProps extends React.HTMLAttributes<HTMLDivElement> {
  options: SegmentedOption[]
  value: string
  onValueChange?: (value: string) => void
}

const Segmented = React.forwardRef<HTMLDivElement, SegmentedProps>(
  ({ className, options, value, onValueChange, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("inline-flex rounded-md bg-surface-2 p-1", className)}
      role="tablist"
      {...props}
    >
      {options.map((option) => {
        const selected = option.value === value

        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onValueChange?.(option.value)}
            className={cn(
              "h-8 rounded-sm px-3 text-sm font-medium text-ink-3 transition",
              selected && "bg-surface text-ink shadow-xs",
              !selected && "hover:text-ink"
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
)
Segmented.displayName = "Segmented"

export { Segmented }
