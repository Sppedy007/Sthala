import { ChevronDown, Info } from "lucide-react"
import {
  AIR_CHANGES_PER_HOUR,
  AIR_HEAT_FACTOR,
  INSIDE_FILM_R,
  OPENING_U,
  OUTSIDE_FILM_R,
} from "@/lib/calc"
import { formatM2 } from "@/lib/format"
import type { AnalysisResult } from "@/lib/types"

export function AssumptionsPanel({ result }: { result: AnalysisResult }) {
  const g = result.geometry
  return (
    <details className="glass group h-full p-6" open>
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 rounded-lg [&::-webkit-details-marker]:hidden">
        <span className="flex items-center gap-2 text-base font-semibold text-white/95">
          <Info className="size-4 text-violet-300" aria-hidden="true" />
          Assumptions & how it works
        </span>
        <ChevronDown className="size-4 text-white/65 transition-transform group-open:rotate-180" aria-hidden="true" />
      </summary>

      <div className="mt-4 flex flex-col gap-4 text-sm leading-relaxed text-white/85">
        <ul className="flex list-disc flex-col gap-1.5 pl-5">
          <li>Steady-state 1D heat conduction for a rectangular box-shaped shelter (Q = Σ(U·A)·ΔT).</li>
          <li>
            Surface air films: inside R = {INSIDE_FILM_R} m²K/W, outside R = {OUTSIDE_FILM_R} m²K/W. Openings modeled at U = {OPENING_U} W/m²K.
          </li>
          <li>
            Ventilation heat: {AIR_HEAT_FACTOR} · ACH · Volume · ΔT with {AIR_CHANGES_PER_HOUR} air changes per hour. Occupant count is noted but human metabolic heat is not added.
          </li>
          <li>Ground/floor heat transfer is excluded from the heat transfer total.</li>
          <li>Solar gain is not modeled (no solar radiation, shading or solar heat gain coefficients).</li>
          <li>Dynamic factors excluded: thermal mass, variable wind pressure, humidity, and internal equipment gains.</li>
          <li>Material conductivities and costs are illustrative — verify with local suppliers and engineers.</li>
        </ul>

        <div className="rounded-2xl bg-white/[0.04] p-4 font-mono text-xs leading-relaxed text-white/85">
          <p>R_total = R_in + Σ(thickness ÷ k) + R_out</p>
          <p>U = 1 ÷ R_total</p>
          <p>Q_fabric = (U_wall·A_wall + U_roof·A_roof + U_open·A_open) · ΔT</p>
          <p>
            Q_vent = {AIR_HEAT_FACTOR} · ACH · Volume · ΔT
          </p>
        </div>

        <dl className="grid grid-cols-2 gap-x-4 gap-y-1 tabular-nums">
          <dt className="text-white/65">Net wall area</dt>
          <dd className="text-right">{formatM2(g.wallAreaM2)}</dd>
          <dt className="text-white/65">Roof area</dt>
          <dd className="text-right">{formatM2(g.roofAreaM2)}</dd>
          <dt className="text-white/65">Volume</dt>
          <dd className="text-right">{g.volumeM3.toFixed(1)} m³</dd>
          <dt className="text-white/65">ΔT</dt>
          <dd className="text-right">{g.deltaTC} °C</dd>
        </dl>

        <p className="text-xs text-white/65">Assumptions version {result.meta.assumptionsVersion}</p>
      </div>
    </details>
  )
}
