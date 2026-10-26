import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

export type Status = "idle" | "configuring" | "calculating" | "comparing" | "recommending" | "success" | "error"

const STEPS = ["Configuring", "Calculating", "Comparing", "Recommendation"] as const

/** Which step index is active for each status (4 = all complete). */
function activeIndex(status: Status, failedAt: number): number {
  switch (status) {
    case "calculating":
      return 1
    case "comparing":
      return 2
    case "recommending":
      return 3
    case "success":
      return 4
    case "error":
      return failedAt
    default:
      return 0
  }
}

export function ProgressSteps({ status, failedAt = 3 }: { status: Status; failedAt?: number }) {
  const current = activeIndex(status, failedAt)
  const announcement =
    status === "success"
      ? "All steps complete. Results are ready."
      : status === "error"
        ? `Something went wrong during ${STEPS[current]}.`
        : `Step ${current + 1} of 4: ${STEPS[current]}`

  return (
    <div>
      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>
      <ol className="grid grid-cols-2 gap-2 sm:grid-cols-4" aria-label="Progress">
        {STEPS.map((step, i) => {
          const done = i < current
          const active = i === current && status !== "success"
          const failed = active && status === "error"
          return (
            <li
              key={step}
              aria-current={active ? "step" : undefined}
              className={cn(
                "flex min-h-11 items-center gap-2 rounded-full border px-3 text-sm transition-colors",
                done && "border-teal/30 text-white/85",
                active && !failed && "border-transparent bg-brand-gradient font-medium text-white",
                failed && "border-saffron/60 text-saffron",
                !done && !active && "border-white/10 text-white/65",
              )}
            >
              <span
                aria-hidden="true"
                className={cn(
                  "grid size-5 shrink-0 place-items-center rounded-full text-[11px] font-semibold",
                  done ? "bg-teal/20 text-teal" : "bg-white/10",
                )}
              >
                {done ? <Check className="size-3" /> : i + 1}
              </span>
              <span className="truncate">{step}</span>
              {done && <span className="sr-only">(complete)</span>}
            </li>
          )
        })}
      </ol>
    </div>
  )
}
