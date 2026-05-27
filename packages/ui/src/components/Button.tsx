import * as React from "react"
import { cn } from "../lib/utils"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "primary" | "secondary" | "accent" | "outline" | "ghost" | "soft" | "danger"
  size?: "sm" | "md" | "lg" | "icon"
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "md", ...props }, ref) => {
    const visualVariant = variant === "default" || variant === "outline" ? "secondary" : variant

    return (
      <button
        className={cn(
          "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-md border border-transparent font-medium tracking-normal transition-[background,border-color,color,box-shadow,transform] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brick-soft focus-visible:ring-offset-2 focus-visible:ring-offset-paper disabled:pointer-events-none disabled:opacity-50 active:translate-y-px",
          {
            "bg-brick text-white shadow-soft hover:bg-brick-hover": visualVariant === "primary",
            "border-line-2 bg-surface text-ink shadow-xs hover:border-line-strong hover:bg-surface-2": visualVariant === "secondary",
            "bg-ochre text-white shadow-soft hover:brightness-95": visualVariant === "accent",
            "bg-transparent text-ink-2 hover:bg-surface-2 hover:text-ink": visualVariant === "ghost",
            "bg-brick-soft text-brick-ink hover:brightness-95": visualVariant === "soft",
            "bg-clay text-white shadow-soft hover:brightness-95": visualVariant === "danger",
          },
          {
            "h-8 px-3 text-xs": size === "sm",
            "h-9 px-4 text-sm": size === "md",
            "h-11 px-5 text-sm": size === "lg",
            "h-9 w-9 p-0": size === "icon",
          },
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
