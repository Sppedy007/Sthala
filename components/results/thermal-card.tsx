import { Thermometer } from "lucide-react"
import { CalculatedBadge } from "@/components/data-badge"
import { formatU, formatW } from "@/lib/format"
import type { AnalysisResult } from "@/lib/types"
import { cn } from "@/lib/utils"

export function ThermalCard({ result }: { result: AnalysisResult }) {
  const direction = result.designs[0].heatDirection
  const max = Math.max(...result.designs.map((d) => d.heatTransferW), 1)

  return (
    <article aria-labelledby="thermal-title" className="glass glass-hover flex h-full flex-col gap-4 p-6">
      <div className="flex items-center justify-between gap-2">
        <h3 id="thermal-title" className="flex items-center gap-2 text-base font-semibold text-white/95">
          <Thermometer className="size-4 text-violet-300" aria-hidden="true" />
          Thermal estimate
        </h3>
        <CalculatedBadge />
      </div>
      <p className="text-sm text-white/65">
        Estimated heat {direction} at ΔT {result.geometry.deltaTC} °C. Lower is better.
      </p>
      <ul className="flex flex-col gap-4">
        {result.designs.map((d) => (
          <li key={d.name} className="flex flex-col gap-1.5">
            <div className="flex items-baseline justify-between gap-2 text-sm">
              <span className={cn("font-medium", d.name === result.recommended ? "text-white/95" : "text-white/85")}>
                {d.name}
              </span>
              <span className="tabular-nums text-white/95">{formatW(d.heatTransferW)}</span>
            </div>
            <div className="h-1.5 rounded-full bg-white/[0.06]" aria-hidden="true">
              <div
                className={cn("h-full rounded-full", d.name === result.recommended ? "bg-violet" : "bg-white/30")}
                style={{ width: `${Math.max(4, (d.heatTransferW / max) * 100)}%` }}
              />
            </div>
            <p className="text-xs tabular-nums text-white/65">
              Wall {formatU(d.uWall)} · Roof {formatU(d.uRoof)}
            </p>
          </li>
        ))}
      </ul>
    </article>
  )
}
