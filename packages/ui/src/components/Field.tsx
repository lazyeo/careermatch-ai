import * as React from "react"
import { cn } from "../lib/utils"

export interface FieldProps {
  label?: React.ReactNode
  hint?: React.ReactNode
  required?: boolean
  error?: React.ReactNode
  children: React.ReactNode
  className?: string
}

export function Field({ label, hint, required, error, children, className }: FieldProps) {
  return (
    <label className={cn("block", className)}>
      {(label || hint) && (
        <span className="mb-1.5 flex items-baseline justify-between gap-3">
          {label && (
            <span className="text-xs font-medium text-ink-2">
              {label}
              {required && <span className="ml-1 text-brick">*</span>}
            </span>
          )}
          {hint && <span className="text-[11px] text-ink-3">{hint}</span>}
        </span>
      )}
      {children}
      {error && <span className="mt-1.5 block text-xs text-clay">{error}</span>}
    </label>
  )
}

export const fieldControlClasses =
  "h-9 w-full rounded-md border border-line-2 bg-surface px-3 text-sm text-ink outline-none transition placeholder:text-ink-4 focus:border-brick focus:ring-2 focus:ring-brick-soft disabled:cursor-not-allowed disabled:opacity-60"
