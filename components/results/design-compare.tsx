"use client"

import { Minus, Plus, Star } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CalculatedBadge } from "@/components/data-badge"
import { formatINR, formatU, formatW } from "@/lib/format"
import { materialName } from "@/lib/materials"
import type { AnalysisResult, DesignResult } from "@/lib/types"
import { cn } from "@/lib/utils"

export function DesignCompare({ result }: { result: AnalysisResult }) {
  return (
    <section aria-labelledby="compare-title" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 id="compare-title" className="text-xl font-semibold text-white/95">
          Compare all three designs
        </h3>
        <CalculatedBadge />
      </div>

      {/* Mobile: tabs */}
      <Tabs defaultValue={result.recommended} className="lg:hidden">
        <TabsList className="grid w-full group-data-horizontal/tabs:h-12 grid-cols-3 rounded-full bg-white/[0.04] p-1">
          {result.designs.map((d) => (
            <TabsTrigger key={d.name} value={d.name} className="min-h-10 rounded-full text-xs sm:text-sm">
              {d.name}
            </TabsTrigger>
          ))}
        </TabsList>
        {result.designs.map((d) => (
          <TabsContent key={d.name} value={d.name} className="mt-3">
            <DesignColumn design={d} recommended={d.name === result.recommended} budget={result.input.budgetINR} />
          </TabsContent>
        ))}
      </Tabs>

      {/* Desktop: side by side */}
      <div className="hidden gap-4 lg:grid lg:grid-cols-3">
        {result.designs.map((d) => (
          <DesignColumn
            key={d.name}
            design={d}
            recommended={d.name === result.recommended}
            budget={result.input.budgetINR}
          />
        ))}
      </div>
    </section>
  )
}

function DesignColumn({ design, recommended, budget }: { design: DesignResult; recommended: boolean; budget: number }) {
  const over = design.estimatedCostINR > budget
  return (
    <article
      aria-label={`${design.name} design${recommended ? " (recommended)" : ""}`}
      className={cn(
        "flex h-full flex-col gap-5 rounded-3xl p-6",
        recommended ? "gradient-ring" : "glass glass-hover",
      )}
    >
      <header className="flex items-center justify-between gap-2">
        <h4 className="text-lg font-semibold text-white/95">{design.name}</h4>
        {recommended && (
          <span className="inline-flex items-center gap-1 rounded-full bg-brand-gradient px-2.5 py-1 text-xs font-medium text-white">
            <Star className="size-3" aria-hidden="true" />
            Recommended
          </span>
        )}
      </header>

      <dl className="grid grid-cols-2 gap-3 text-sm tabular-nums">
        <Stat label="U-value wall" value={formatU(design.uWall)} />
        <Stat label="U-value roof" value={formatU(design.uRoof)} />
        <Stat label={`Heat ${design.heatDirection}`} value={formatW(design.heatTransferW)} />
        <Stat label="Estimated cost" value={formatINR(design.estimatedCostINR)} tone={over ? "over" : "ok"} />
      </dl>

      <p className="text-xs text-white/65">
        {materialName(design.wallMaterialId)} · {materialName(design.roofMaterialId)} ·{" "}
        {materialName(design.insulationMaterialId)} {design.insulationThicknessMm} mm
      </p>

      <div className="flex flex-col gap-2">
        <h5 className="text-sm font-medium text-white/95">Advantages</h5>
        <ul className="flex flex-col gap-1.5 text-sm text-white/85">
          {design.advantages.map((a) => (
            <li key={a} className="flex gap-2">
              <Plus className="mt-0.5 size-4 shrink-0 text-teal" aria-hidden="true" />
              {a}
            </li>
          ))}
        </ul>
      </div>
      <div className="flex flex-col gap-2">
        <h5 className="text-sm font-medium text-white/95">Disadvantages</h5>
        <ul className="flex flex-col gap-1.5 text-sm text-white/85">
          {design.disadvantages.map((a) => (
            <li key={a} className="flex gap-2">
              <Minus className="mt-0.5 size-4 shrink-0 text-saffron" aria-hidden="true" />
              {a}
            </li>
          ))}
        </ul>
      </div>

      <p className="mt-auto rounded-2xl bg-white/[0.04] p-4 text-sm leading-relaxed text-white/85">
        {design.plainSummary}
      </p>
    </article>
  )
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "ok" | "over" }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-white/65">{label}</dt>
      <dd className={cn("font-medium text-white/95", tone === "over" && "text-saffron")}>
        {value}
        {tone === "over" && <span className="sr-only"> (over budget)</span>}
      </dd>
    </div>
  )
}
