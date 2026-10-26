import { Calculator, FlaskConical } from "lucide-react"
import { cn } from "@/lib/utils"

// Two badge types used everywhere so users can tell formula output
// apart from placeholder / illustrative values. Icon + text, never colour alone.

export function CalculatedBadge({ className, label = "Calculated" }: { className?: string; label?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-teal/40 bg-teal/10 px-2 py-0.5 text-[11px] font-medium text-teal",
        className,
      )}
    >
      <Calculator className="size-3" aria-hidden="true" />
      {label}
    </span>
  )
}

export function IllustrativeBadge({ className, label = "Illustrative" }: { className?: string; label?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-amber-400/50 px-2 py-0.5 text-[11px] font-medium text-amber-300",
        className,
      )}
    >
      <FlaskConical className="size-3" aria-hidden="true" />
      {label}
    </span>
  )
}
