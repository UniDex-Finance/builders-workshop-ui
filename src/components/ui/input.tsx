import * as React from "react"

import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, ...props }, ref) => {
    return (
      <div className="relative flex w-full bg-[var(--textbox-background)] border rounded-md shadow-sm h-9 border-[var(--textbox-border)]">
        {label && (
          <span className="absolute text-sm -translate-y-1/2 left-3 top-1/2 text-muted-foreground">
            {label}
          </span>
        )}
        <input
          type={type}
          className={cn(
            "w-full bg-transparent px-3 py-1 text-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
            label && "text-right pr-3",
            className
          )}
          ref={ref}
          {...props}
        />
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input }
