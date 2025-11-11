import * as React from "react"
import { cn } from "../lib/utils"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "primary" | "accent" | "outline" | "ghost"
  size?: "sm" | "md" | "lg"
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "md", ...props }, ref) => {
    return (
      <button
        className={cn(
          "inline-flex items-center justify-center rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
          {
            "bg-gray-100 text-gray-900 hover:bg-gray-200": variant === "default",
            "bg-primary-600 text-white hover:bg-primary-700 shadow-soft": variant === "primary",
            "bg-accent-600 text-white hover:bg-accent-700 shadow-soft": variant === "accent",
            "border border-gray-300 bg-white hover:bg-gray-50": variant === "outline",
            "hover:bg-gray-100": variant === "ghost",
          },
          {
            "h-8 px-3 text-sm": size === "sm",
            "h-10 px-4": size === "md",
            "h-12 px-6 text-lg": size === "lg",
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
