import * as React from "react"

import { cn } from "@/lib/utils"

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[140px] w-full rounded-xl border border-white/10 bg-black/40 backdrop-blur-md px-4 py-3 text-base md:text-sm text-white placeholder:text-gray-500 focus-visible:outline-none focus-visible:border-purple-400/50 focus-visible:bg-black/60 focus-visible:shadow-[0_0_20px_rgba(168,85,247,0.3)] transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-50 resize-none relative overflow-hidden",
          "before:absolute before:inset-0 before:bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.05)_50%,transparent_100%)] before:opacity-0 hover:before:opacity-100 before:transition-opacity",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }

