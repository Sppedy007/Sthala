import { Layers3 } from "lucide-react"
import { CalculatedBadge, IllustrativeBadge } from "@/components/data-badge"
import { formatINR, formatK, formatM2, formatMm, formatPct } from "@/lib/format"
import type { AnalysisResult } from "@/lib/types"

export function MaterialBreakdown({ result }: { result: AnalysisResult }) {
  // "Balanced" is built from the user's own material choices.
  const design = result.designs.find((d) => d.name === "Balanced")!

  return (
    <article aria-labelledby="breakdown-title" className="glass flex flex-col gap-4 p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 id="breakdown-title" className="flex items-center gap-2 text-base font-semibold text-white/95">
          <Layers3 className="size-4 text-violet-300" aria-hidden="true" />
          Your selected materials
        </h3>
        <div className="flex flex-wrap gap-2">
          <CalculatedBadge label="Areas & cost: calculated" />
          <IllustrativeBadge label="k & rates: illustrative" />
        </div>
      </div>

      {/* Table on wider screens */}
      <div className="hidden md:block">
        <table className="w-full text-left text-sm">
          <caption className="sr-only">Material breakdown for the Balanced design</caption>
          <thead className="text-white/65">
            <tr className="border-b border-white/10">
              <th scope="col" className="py-2 pr-4 font-medium">Element</th>
              <th scope="col" className="py-2 pr-4 font-medium">Material</th>
              <th scope="col" className="py-2 pr-4 font-medium">Thickness</th>
              <th scope="col" className="py-2 pr-4 font-medium">Area</th>
              <th scope="col" className="py-2 pr-4 font-medium">Conductivity k</th>
              <th scope="col" className="py-2 pr-4 text-right font-medium">Cost</th>
              <th scope="col" className="py-2 text-right font-medium">Share</th>
            </tr>
          </thead>
          <tbody className="tabular-nums">
            {design.breakdown.map((line) => (
              <tr key={line.role} className="border-b border-white/5 last:border-0">
                <th scope="row" className="py-3 pr-4 font-medium text-white/95">{line.role}</th>
                <td className="py-3 pr-4 text-white/85">{line.materialName}</td>
                <td className="py-3 pr-4 text-white/85">{formatMm(line.thicknessMm)}</td>
                <td className="py-3 pr-4 text-white/85">{formatM2(line.areaM2)}</td>
                <td className="py-3 pr-4 text-white/85">{line.conductivityWPerMK > 0 ? formatK(line.conductivityWPerMK) : "—"}</td>
                <td className="py-3 pr-4 text-right text-white/95">{formatINR(line.costINR)}</td>
                <td className="py-3 text-right text-white/85">{formatPct(line.costSharePct)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Stacked cards on mobile — avoids horizontal scrolling */}
      <ul className="flex flex-col gap-3 md:hidden">
        {design.breakdown.map((line) => (
          <li key={line.role} className="rounded-2xl border border-white/10 p-4">
            <p className="mb-2 text-sm font-semibold text-white/95">
              {line.role}: <span className="font-normal text-white/85">{line.materialName}</span>
            </p>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm tabular-nums">
              <dt className="text-white/65">Thickness</dt>
              <dd className="text-right text-white/85">{formatMm(line.thicknessMm)}</dd>
              <dt className="text-white/65">Area</dt>
              <dd className="text-right text-white/85">{formatM2(line.areaM2)}</dd>
              <dt className="text-white/65">Conductivity</dt>
              <dd className="text-right text-white/85">
                {line.conductivityWPerMK > 0 ? formatK(line.conductivityWPerMK) : "—"}
              </dd>
              <dt className="text-white/65">Cost</dt>
              <dd className="text-right text-white/95">
                {formatINR(line.costINR)} ({formatPct(line.costSharePct)})
              </dd>
            </dl>
          </li>
        ))}
      </ul>

      <p className="text-xs text-white/65">
        Openings ({formatM2(result.geometry.openingAreaM2)}) use an assumed U-value of {design.uOpening} W/m²K and are not
        priced.
      </p>
    </article>
  )
}
