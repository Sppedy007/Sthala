"use client"

import { useReducer, useRef } from "react"
import { motion } from "framer-motion"
import { AlertTriangle, RefreshCw } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ConfigForm } from "@/components/config-form"
import { GemmaBadge } from "@/components/gemma-badge"
import { Wordmark } from "@/components/hero"
import { ProgressSteps, type Status } from "@/components/progress-steps"
import { ResultsSkeleton } from "@/components/results-skeleton"
import { ScenarioChips } from "@/components/scenario-chips"
import { AssumptionsPanel } from "@/components/results/assumptions-panel"
import { CostCard } from "@/components/results/cost-card"
import { DesignCompare } from "@/components/results/design-compare"
import { GemmaPanel } from "@/components/results/gemma-panel"
import { MaterialBreakdown } from "@/components/results/material-breakdown"
import { RecommendationCard } from "@/components/results/recommendation-card"
import { ThermalCard } from "@/components/results/thermal-card"
import { Footer } from "@/components/footer"
import { analyze } from "@/lib/analyze"
import { explainShelter } from "@/lib/explain"
import { DEFAULT_FORM, formToInput } from "@/lib/scenarios"
import type { AdvisorState, AnalysisResult, FormState, ShelterInput } from "@/lib/types"

type State = {
  status: Status
  form: FormState
  result: AnalysisResult | null
  advisor: AdvisorState
  error: string | null
}

type Action =
  | { type: "patch"; patch: Partial<FormState> }
  | { type: "setForm"; form: FormState }
  | { type: "step"; status: Status }
  | { type: "success"; result: AnalysisResult }
  | { type: "setAdvisor"; advisor: AdvisorState }
  | { type: "error"; message: string }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "patch":
      return { ...state, form: { ...state.form, ...action.patch }, status: isBusy(state.status) ? state.status : "configuring" }
    case "setForm":
      return { ...state, form: action.form, status: "configuring" }
    case "step":
      return { ...state, status: action.status, error: null }
    case "success":
      return { ...state, status: "success", result: action.result, error: null }
    case "setAdvisor":
      return { ...state, advisor: action.advisor }
    case "error":
      return { ...state, status: "error", error: action.message }
  }
}

const isBusy = (s: Status) => s === "calculating" || s === "comparing" || s === "recommending"

export function Workspace() {
  const [state, dispatch] = useReducer(reducer, {
    status: "idle",
    form: DEFAULT_FORM,
    result: null,
    advisor: { status: "idle", data: null },
    error: null,
  })
  const resultsRef = useRef<HTMLHeadingElement>(null)
  const abortRef = useRef<AbortController | null>(null)
  const busy = isBusy(state.status)

  const fetchExplanation = async (input: ShelterInput) => {
    if (abortRef.current) {
      abortRef.current.abort()
    }
    const controller = new AbortController()
    abortRef.current = controller

    dispatch({ type: "setAdvisor", advisor: { status: "loading", data: null } })

    const outcome = await explainShelter(input, { signal: controller.signal })
    if (controller.signal.aborted) return

    if (outcome.ok) {
      dispatch({ type: "setAdvisor", advisor: { status: "success", data: outcome.data } })
    } else {
      dispatch({
        type: "setAdvisor",
        advisor: { status: "error", data: null, error: outcome.error },
      })
    }
  }

  const run = (form: FormState) => {
    try {
      const input = formToInput(form)
      // 1. Show calculated results immediately
      const result = analyze(input)
      dispatch({ type: "success", result })
      requestAnimationFrame(() => {
        resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
        resultsRef.current?.focus({ preventScroll: true })
      })

      // 2. Request AI explanation
      void fetchExplanation(input)
    } catch (err: unknown) {
      dispatch({
        type: "error",
        message: err instanceof Error ? err.message : "The calculation could not be completed. Please check your inputs.",
      })
    }
  }

  const handleRetryExplanation = () => {
    if (state.result) {
      void fetchExplanation(state.result.input)
    }
  }

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-white/10 bg-ink/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-5 py-2">
          <Wordmark />
          <div className="flex items-center gap-2">
            <GemmaBadge />
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-7xl flex-col gap-8 px-5 py-8 md:py-12">
        <div className="flex flex-col gap-3">
          <h1 className="text-balance text-4xl font-bold text-white/95 md:text-5xl">Shelter workspace</h1>
          <p className="max-w-2xl text-pretty text-white/65">
            Configure the climate, size and materials, then compare three indicative designs.
          </p>
        </div>

        <section aria-labelledby="config-title" className="animated-border p-5 md:p-8">
          <div className="mb-6 flex flex-col gap-4">
            <h2 id="config-title" className="text-xl font-semibold text-white/95">
              Configuration
            </h2>
            <div className="flex flex-col gap-2">
              <p className="text-sm text-white/65">Start from an example:</p>
              <ScenarioChips onSelect={(s) => dispatch({ type: "setForm", form: s.form })} />
            </div>
          </div>
          <ConfigForm
            form={state.form}
            onChange={(patch) => dispatch({ type: "patch", patch })}
            onSubmit={() => run(state.form)}
            busy={busy}
          />
        </section>

        <ProgressSteps status={state.status} />

        <section aria-labelledby="results-title" aria-busy={busy} className="flex scroll-mt-24 flex-col gap-4">
          <h2 id="results-title" ref={resultsRef} tabIndex={-1} className="text-xl font-semibold text-white/95">
            Results
          </h2>

          {state.status === "error" && (
            <Alert className="border-saffron/50 bg-saffron/10 text-white">
              <AlertTriangle className="text-saffron" aria-hidden="true" />
              <AlertTitle>Something went wrong</AlertTitle>
              <AlertDescription className="flex flex-col items-start gap-3 text-white/85">
                <p>{state.error}</p>
                <button
                  type="button"
                  onClick={() => run(state.form)}
                  className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/20 px-4 text-sm font-medium text-white hover:bg-white/[0.06]"
                >
                  <RefreshCw className="size-4" aria-hidden="true" />
                  Retry
                </button>
              </AlertDescription>
            </Alert>
          )}

          {busy ? (
            <ResultsSkeleton />
          ) : state.result ? (
            <Results
              result={state.result}
              advisor={state.advisor}
              onRetry={handleRetryExplanation}
            />
          ) : (
            state.status !== "error" && (
              <div className="glass p-8 text-center text-white/65">
                Press <span className="font-medium text-white/95">Compare Designs</span> to see three options.
              </div>
            )
          )}
        </section>
      </main>

      <Footer maxWidth="max-w-7xl" />
    </>
  )
}

function Results({
  result,
  advisor,
  onRetry,
}: {
  result: AnalysisResult
  advisor?: AdvisorState
  onRetry?: () => void
}) {
  const item = (delay: number) => ({
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4, delay, ease: "easeOut" as const },
  })

  return (
    <div className="flex flex-col gap-4">
      {result.warnings.length > 0 && (
        <motion.div {...item(0)}>
          <Alert className="border-saffron/40 bg-saffron/[0.06] text-white">
            <AlertTriangle className="text-saffron" aria-hidden="true" />
            <AlertTitle>Please note</AlertTitle>
            <AlertDescription className="text-white/85">
              <ul className="list-disc pl-4">
                {result.warnings.map((w) => (
                  <li key={w}>{w}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        </motion.div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <motion.div {...item(0.05)} className="md:col-span-2">
          <RecommendationCard result={result} />
        </motion.div>
        <motion.div {...item(0.1)}>
          <ThermalCard result={result} />
        </motion.div>
        <motion.div {...item(0.15)}>
          <CostCard result={result} />
        </motion.div>
        <motion.div {...item(0.2)} className="md:col-span-2 lg:col-span-4">
          <MaterialBreakdown result={result} />
        </motion.div>
        <motion.div {...item(0.25)} className="md:col-span-2 lg:col-span-4">
          <DesignCompare result={result} />
        </motion.div>
        <motion.div {...item(0.3)} className="md:col-span-2 lg:col-span-4">
          <GemmaPanel result={result} advisor={advisor} onRetry={onRetry} />
        </motion.div>
        <motion.div {...item(0.35)} className="md:col-span-2 lg:col-span-4">
          <AssumptionsPanel result={result} />
        </motion.div>
      </div>
    </div>
  )
}
