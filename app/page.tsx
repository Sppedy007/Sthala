import { Coins, Layers3, MessageSquareText, Thermometer } from "lucide-react"
import { Footer } from "@/components/footer"
import { Hero, Wordmark } from "@/components/hero"
import { analyzeSync } from "@/lib/analyze"
import { DEFAULT_FORM, formToInput } from "@/lib/scenarios"

const FEATURES = [
  { icon: Layers3, title: "Compare 3 designs", body: "Budget, Balanced and High Insulation options side by side." },
  { icon: Thermometer, title: "Thermal estimates", body: "Indicative heat flow in watts and U-values for each design." },
  { icon: Coins, title: "Budget-aware", body: "See which options may fit your budget before you buy materials." },
  {
    icon: MessageSquareText,
    title: "Plain-language AI explanation",
    body: "Trade-offs explained without jargon based on calculated thermal and cost results.",
  },
]

export default function LandingPage() {
  // Sample card numbers come from the same formulas used in the workspace.
  const sample = analyzeSync(formToInput(DEFAULT_FORM), "2026-10-26T00:00:00.000Z")
  const previewRows = sample.designs.map((d) => ({
    name: d.name,
    heatW: d.heatTransferW,
    costINR: d.estimatedCostINR,
  }))

  return (
    <>
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
        <Wordmark />
      </header>
      <main className="relative isolate overflow-x-clip">
        <Hero previewRows={previewRows} />
        <section aria-labelledby="features-title" className="mx-auto max-w-6xl px-5 pb-20">
          <h2 id="features-title" className="sr-only">
            Features
          </h2>
          <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map(({ icon: Icon, title, body }) => (
              <li key={title} className="glass glass-hover flex flex-col gap-3 p-6">
                <Icon className="size-5 text-violet-300" aria-hidden="true" />
                <h3 className="text-base font-semibold text-white/95">{title}</h3>
                <p className="text-sm leading-relaxed text-white/65">{body}</p>
              </li>
            ))}
          </ul>
        </section>
      </main>
      <Footer maxWidth="max-w-6xl" />
    </>
  )
}
