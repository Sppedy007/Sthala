import { AlertTriangle, BadgeCheck } from "lucide-react"
import { CalculatedBadge } from "@/components/data-badge"
import { formatINR, formatW } from "@/lib/format"
import { materialName } from "@/lib/materials"
import type { AnalysisResult } from "@/lib/types"

export function RecommendationCard({ result }: { result: AnalysisResult }) {
  const rec = result.designs.find((d) => d.name === result.recommended)!
  const headroom = result.input.budgetINR - rec.estimatedCostINR

  return (
    <article aria-labelledby="rec-title" className="gradient-ring flex h-full flex-col gap-5 rounded-3xl p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium uppercase tracking-wider text-white/65">Recommended design</p>
        {result.withinBudget ? (
          <span className="inline-flex items-center gap-1 rounded-full border border-teal/40 bg-teal/10 px-2.5 py-1 text-xs font-medium text-teal">
            <BadgeCheck className="size-3.5" aria-hidden="true" />
            Within budget
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full border border-saffron/50 bg-saffron/10 px-2.5 py-1 text-xs font-medium text-saffron">
            <AlertTriangle className="size-3.5" aria-hidden="true" />
            Over budget
          </span>
        )}
      </div>

      <h3 id="rec-title" className="text-4xl font-bold text-white/95 md:text-5xl">
        {rec.name}
      </h3>

      <dl className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <dt className="text-sm text-white/65">Estimated heat {rec.heatDirection}</dt>
          <dd className="font-heading text-2xl font-semibold tabular-nums text-white/95">{formatW(rec.heatTransferW)}</dd>
        </div>
        <div className="flex flex-col gap-1">
          <dt className="text-sm text-white/65">Estimated cost</dt>
          <dd className="font-heading text-2xl font-semibold tabular-nums text-white/95">
            {formatINR(rec.estimatedCostINR)}
          </dd>
        </div>
        <div className="col-span-2 flex flex-col gap-1">
          <dt className="text-sm text-white/65">{headroom >= 0 ? "Budget remaining" : "Over budget by"}</dt>
          <dd className="tabular-nums text-white/95">{formatINR(Math.abs(headroom))}</dd>
        </div>
      </dl>

      <p className="text-pretty leading-relaxed text-white/85">{rec.plainSummary}</p>

      <div className="mt-auto flex flex-wrap items-center gap-2 text-xs text-white/65">
        <CalculatedBadge />
        <span>
          {materialName(rec.wallMaterialId)} · {materialName(rec.roofMaterialId)} · {materialName(rec.insulationMaterialId)}{" "}
          {rec.insulationThicknessMm} mm
        </span>
      </div>
    </article>
  )
}
