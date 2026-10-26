"use client"

import {
  AlertTriangle,
  BadgeCheck,
  ChevronDown,
  ChevronRight,
  Copy,
  Lightbulb,
  Minus,
  Plus,
  RefreshCw,
  Share2,
  Sparkles,
  Star,
  TrendingDown,
} from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { GemmaBadge } from "@/components/gemma-badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { buildReport } from "@/lib/report"
import type {
  AdvisorState,
  AnalysisResult,
  DesignAnalysis,
  DesignImprovement,
  GemmaExplanation,
} from "@/lib/types"
import { cn } from "@/lib/utils"

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="text-[10px] font-semibold uppercase tracking-widest text-white/50">
      {children}
    </h4>
  )
}

function AdvantageItem({ text }: { text: string }) {
  return (
    <li className="flex gap-2 text-sm text-white/85">
      <Plus className="mt-0.5 size-3.5 shrink-0 text-teal" aria-hidden="true" />
      {text}
    </li>
  )
}

function LimitationItem({ text }: { text: string }) {
  return (
    <li className="flex gap-2 text-sm text-white/85">
      <Minus className="mt-0.5 size-3.5 shrink-0 text-saffron" aria-hidden="true" />
      {text}
    </li>
  )
}

function ImprovementItem({ item }: { item: DesignImprovement }) {
  return (
    <li className="rounded-xl bg-violet-500/[0.06] border border-violet-400/10 p-3">
      <p className="flex items-start gap-2 text-sm text-white/90">
        <Lightbulb className="mt-0.5 size-3.5 shrink-0 text-violet-300" aria-hidden="true" />
        {item.suggestion}
      </p>
      {item.quantifiedImpact && (
        <p className="mt-1.5 flex items-center gap-1.5 pl-5 text-xs text-violet-300">
          <TrendingDown className="size-3 shrink-0" aria-hidden="true" />
          {item.quantifiedImpact}
        </p>
      )}
    </li>
  )
}

function DesignAnalysisPanel({
  analysis,
  isRecommended,
}: {
  analysis: DesignAnalysis
  isRecommended: boolean
}) {
  return (
    <div className="flex flex-col gap-4">
      {isRecommended && (
        <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-teal/40 bg-teal/10 px-2.5 py-1 text-xs font-medium text-teal">
          <Star className="size-3" aria-hidden="true" />
          Calculator&apos;s recommended design
        </span>
      )}

      {analysis.advantages.length > 0 && (
        <section className="flex flex-col gap-2">
          <SectionHeading>Advantages</SectionHeading>
          <ul className="flex flex-col gap-1.5">
            {analysis.advantages.map((a, i) => (
              <AdvantageItem key={i} text={a} />
            ))}
          </ul>
        </section>
      )}

      {analysis.limitations.length > 0 && (
        <section className="flex flex-col gap-2">
          <SectionHeading>Limitations</SectionHeading>
          <ul className="flex flex-col gap-1.5">
            {analysis.limitations.map((l, i) => (
              <LimitationItem key={i} text={l} />
            ))}
          </ul>
        </section>
      )}

      {analysis.improvements.length > 0 && (
        <section className="flex flex-col gap-2">
          <SectionHeading>Suggested improvements</SectionHeading>
          <ul className="flex flex-col gap-2">
            {analysis.improvements.map((imp, i) => (
              <ImprovementItem key={i} item={imp} />
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}

function BestRecommendationCard({
  gemma,
}: {
  gemma: GemmaExplanation
}) {
  const rec = gemma.bestRecommendation
  const [open, setOpen] = useState(true)

  return (
    <article
      aria-labelledby="gemma-rec-title"
      className="rounded-3xl border border-violet-400/25 bg-gradient-to-br from-violet-500/10 via-violet-500/5 to-transparent p-6"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <div className="grid size-7 place-items-center rounded-full bg-brand-gradient">
              <Sparkles className="size-3.5 text-white" aria-hidden="true" />
            </div>
            <h3
              id="gemma-rec-title"
              className="text-sm font-semibold uppercase tracking-widest text-violet-300"
            >
              Gemma&apos;s Best Recommendation
            </h3>
          </div>
          <p className="text-2xl font-bold text-white/95 pl-9">{rec.recommendedDesign}</p>
        </div>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="mt-1 grid size-8 shrink-0 place-items-center rounded-full border border-white/10 text-white/60 hover:bg-white/[0.06]"
        >
          {open ? (
            <ChevronDown className="size-4" aria-hidden="true" />
          ) : (
            <ChevronRight className="size-4" aria-hidden="true" />
          )}
          <span className="sr-only">{open ? "Collapse" : "Expand"}</span>
        </button>
      </div>

      {open && (
        <div className="mt-5 flex flex-col gap-5">
          {/* Rationale */}
          <p className="text-sm leading-relaxed text-white/85">{rec.rationale}</p>

          {/* Constraints satisfied */}
          {rec.constraintsSatisfied.length > 0 && (
            <section className="flex flex-col gap-2">
              <SectionHeading>Constraints satisfied</SectionHeading>
              <ul className="flex flex-col gap-1.5">
                {rec.constraintsSatisfied.map((c, i) => (
                  <li key={i} className="flex gap-2 text-sm text-white/85">
                    <BadgeCheck className="mt-0.5 size-3.5 shrink-0 text-teal" aria-hidden="true" />
                    {c}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Trade-offs */}
          {rec.tradeoffs.length > 0 && (
            <section className="flex flex-col gap-2">
              <SectionHeading>Trade-offs to accept</SectionHeading>
              <ul className="flex flex-col gap-1.5">
                {rec.tradeoffs.map((t, i) => (
                  <li key={i} className="flex gap-2 text-sm text-white/75">
                    <AlertTriangle
                      className="mt-0.5 size-3.5 shrink-0 text-saffron"
                      aria-hidden="true"
                    />
                    {t}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Alternatives */}
          {rec.alternatives.length > 0 && (
            <section className="flex flex-col gap-2">
              <SectionHeading>Alternative options</SectionHeading>
              <ul className="flex flex-col gap-2">
                {rec.alternatives.map((alt, i) => (
                  <li
                    key={i}
                    className="rounded-xl border border-white/8 bg-white/[0.03] p-3"
                  >
                    <p className="text-sm font-medium text-white/95">{alt.designName}</p>
                    <p className="mt-0.5 text-xs text-white/65">{alt.summary}</p>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </article>
  )
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function GemmaSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Sparkles className="size-4 animate-spin text-violet-300" aria-hidden="true" />
        <span className="text-xs text-violet-300">Gemma is analysing your shelter designs…</span>
      </div>
      <div className="shimmer h-20 rounded-2xl" />
      <div className="grid grid-cols-3 gap-3">
        <div className="shimmer h-8 rounded-xl" />
        <div className="shimmer h-8 rounded-xl" />
        <div className="shimmer h-8 rounded-xl" />
      </div>
      <div className="flex flex-col gap-2">
        <div className="shimmer h-3 w-24 rounded" />
        <div className="shimmer h-16 rounded-xl" />
        <div className="shimmer h-16 rounded-xl" />
      </div>
      <div className="shimmer h-32 rounded-2xl" />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main GemmaPanel
// ---------------------------------------------------------------------------

export function GemmaPanel({
  result,
  advisor = { status: "idle", data: null },
  onRetry,
}: {
  result: AnalysisResult
  advisor?: AdvisorState | null
  onRetry?: () => void
}) {
  const currentAdvisor = advisor?.data ?? result.advisor
  const status = advisor?.status ?? (currentAdvisor ? "success" : "idle")
  const report = buildReport(result, currentAdvisor)

  const copy = async (text: string, message: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success(message)
    } catch {
      toast.error("Could not copy. Your browser may have blocked clipboard access.")
    }
  }

  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: "Sthala shelter comparison", text: report })
        return
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return
      }
    }
    await copy(window.location.href, "Link copied to clipboard.")
  }

  return (
    <article aria-labelledby="advisor-title" className="glass flex h-full flex-col gap-5 p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3
          id="advisor-title"
          className="flex items-center gap-2 text-base font-semibold text-white/95"
        >
          <Sparkles className="size-4 text-violet-300" aria-hidden="true" />
          AI Analysis
        </h3>
        <GemmaBadge />
      </div>

      {/* Loading */}
      {status === "loading" && <GemmaSkeleton />}

      {/* Error */}
      {status === "error" && (
        <div className="flex flex-1 flex-col items-start justify-center gap-3 rounded-2xl border border-saffron/30 bg-saffron/[0.04] p-5 text-sm">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="size-5 shrink-0 text-saffron" aria-hidden="true" />
            <div>
              <p className="font-semibold text-white/95">
                AI analysis unavailable — calculated results above are unaffected
              </p>
              {advisor?.error && (
                <p className="mt-1 text-xs text-white/60">{advisor.error}</p>
              )}
            </div>
          </div>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="mt-1 inline-flex min-h-11 items-center gap-2 rounded-full border border-white/20 bg-white/[0.04] px-4 text-xs font-semibold text-white transition-colors hover:bg-white/[0.08]"
            >
              <RefreshCw className="size-3.5" aria-hidden="true" />
              Retry AI analysis
            </button>
          )}
        </div>
      )}

      {/* Success */}
      {status === "success" && currentAdvisor && (
        <div className="flex flex-col gap-6">
          {/* Overall summary */}
          <p className="text-sm leading-relaxed text-white/85 font-medium">
            {currentAdvisor.summary}
          </p>

          {/* Feature 1: Per-design analysis tabs */}
          <section aria-labelledby="design-analysis-heading" className="flex flex-col gap-3">
            <h4
              id="design-analysis-heading"
              className="text-[10px] font-semibold uppercase tracking-widest text-white/50"
            >
              Design-by-design analysis
            </h4>
            <Tabs defaultValue={result.recommended} className="w-full">
              <TabsList className="grid w-full grid-cols-3 rounded-full bg-white/[0.04] p-1">
                {result.designs.map((d) => (
                  <TabsTrigger
                    key={d.name}
                    value={d.name}
                    className="min-h-9 rounded-full text-xs"
                  >
                    {d.name}
                  </TabsTrigger>
                ))}
              </TabsList>
              {result.designs.map((d) => {
                const analysis = currentAdvisor.designAnalyses.find(
                  (a) => a.designName === d.name,
                )
                return (
                  <TabsContent key={d.name} value={d.name} className="mt-4">
                    {analysis ? (
                      <DesignAnalysisPanel
                        analysis={analysis}
                        isRecommended={d.name === result.recommended}
                      />
                    ) : (
                      <p className="text-sm text-white/50">
                        Analysis for this design is unavailable.
                      </p>
                    )}
                  </TabsContent>
                )
              })}
            </Tabs>
          </section>

          {/* Feature 2: Best recommendation */}
          <BestRecommendationCard gemma={currentAdvisor} />

          {/* Caveats */}
          {currentAdvisor.caveats.length > 0 && (
            <section className="flex flex-col gap-1.5">
              <SectionHeading>Caveats</SectionHeading>
              <ul className="flex list-disc flex-col gap-1 pl-4 text-xs text-white/55">
                {currentAdvisor.caveats.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}

      {/* Idle */}
      {status === "idle" && !currentAdvisor && (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-8 text-center">
          <div className="grid size-10 place-items-center rounded-full bg-violet-500/10 text-violet-300">
            <Sparkles className="size-5" aria-hidden="true" />
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium text-white/95">Gemma analysis will appear here</p>
            <p className="max-w-xs text-xs leading-relaxed text-white/65">
              Once you run a comparison, Gemma will explain advantages, limitations and improvements
              for each design, and recommend the best fit for your constraints.
            </p>
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="mt-auto flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => copy(report, "Report copied to clipboard.")}
          className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/15 px-4 text-sm font-medium text-white/90 transition-colors hover:bg-white/[0.06]"
        >
          <Copy className="size-4" aria-hidden="true" />
          Copy report
        </button>
        <button
          type="button"
          onClick={share}
          className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/15 px-4 text-sm font-medium text-white/90 transition-colors hover:bg-white/[0.06]"
        >
          <Share2 className="size-4" aria-hidden="true" />
          Share
        </button>
      </div>
    </article>
  )
}
