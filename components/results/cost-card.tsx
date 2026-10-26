import { Wallet } from "lucide-react"
import { IllustrativeBadge } from "@/components/data-badge"
import { formatINR } from "@/lib/format"
import type { AnalysisResult } from "@/lib/types"
import { cn } from "@/lib/utils"

export function CostCard({ result }: { result: AnalysisResult }) {
  const budget = result.input.budgetINR
  const max = Math.max(budget, ...result.designs.map((d) => d.estimatedCostINR))

  return (
    <article aria-labelledby="cost-title" className="glass glass-hover flex h-full flex-col gap-4 p-6">
      <div className="flex items-center justify-between gap-2">
        <h3 id="cost-title" className="flex items-center gap-2 text-base font-semibold text-white/95">
          <Wallet className="size-4 text-violet-300" aria-hidden="true" />
          Cost vs budget
        </h3>
        <IllustrativeBadge label="Illustrative prices" />
      </div>
      <p className="text-sm text-white/65">
        Budget <span className="tabular-nums text-white/95">{formatINR(budget)}</span>. Materials only.
      </p>
      <ul className="flex flex-col gap-4">
        {result.designs.map((d) => {
          const over = d.estimatedCostINR > budget
          return (
            <li key={d.name} className="flex flex-col gap-1.5">
              <div className="flex items-baseline justify-between gap-2 text-sm">
                <span className="font-medium text-white/85">{d.name}</span>
                <span className="tabular-nums text-white/95">{formatINR(d.estimatedCostINR)}</span>
              </div>
              <div className="relative h-1.5 rounded-full bg-white/[0.06]" aria-hidden="true">
                <div
                  className={cn("h-full rounded-full", over ? "bg-saffron" : "bg-teal")}
                  style={{ width: `${(d.estimatedCostINR / max) * 100}%` }}
                />
                <div
                  className="absolute -top-1 h-3.5 w-0.5 rounded bg-white/80"
                  style={{ left: `calc(${(budget / max) * 100}% - 1px)` }}
                />
              </div>
              <p className={cn("text-xs", over ? "text-saffron" : "text-white/65")}>
                {over ? `Over by ${formatINR(d.estimatedCostINR - budget)}` : `Within budget`}
              </p>
            </li>
          )
        })}
      </ul>
    </article>
  )
}
