import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { HeroPreviewCard, type PreviewRow } from "@/components/hero-preview-card"

export function Wordmark() {
  return (
    <Link
      href="/"
      className="inline-flex min-h-11 items-center gap-2 rounded-lg font-heading text-lg font-bold tracking-tight text-white/95"
    >
      <span aria-hidden="true" className="grid size-7 place-items-center rounded-lg bg-brand-gradient text-sm">
        S
      </span>
      Sthala
    </Link>
  )
}

export function Hero({ previewRows }: { previewRows: PreviewRow[] }) {
  return (
    <section aria-labelledby="hero-title" className="relative isolate overflow-x-clip">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-12 -z-10 -translate-x-1/2"
      >
        <div className="hero-orb size-[540px] rounded-full opacity-60 md:size-[800px] lg:size-[960px]" />
      </div>
      <div className="mx-auto grid max-w-6xl gap-12 px-5 pb-16 pt-12 md:pt-20 lg:grid-cols-[1.3fr_1fr] lg:items-center lg:gap-10">
        <div className="flex flex-col gap-6">
          <h1
            id="hero-title"
            className="text-balance text-5xl font-bold leading-[1.02] text-white/95 md:text-6xl lg:text-7xl"
          >
            Design shelters that adapt to the climate, not the other way around.
          </h1>
          <p className="max-w-xl text-pretty text-lg leading-relaxed text-white/65">
            Sthala compares shelter materials, insulation, thermal performance and budget before you build.
          </p>
          <div>
            <Link
              href="/workspace"
              className="inline-flex min-h-12 items-center gap-2 rounded-full bg-brand-gradient px-6 text-base font-semibold text-white shadow-[0_8px_30px_-8px_rgba(124,92,255,0.7)] transition-transform hover:-translate-y-0.5"
            >
              Design your shelter
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
        <HeroPreviewCard rows={previewRows} />
      </div>
    </section>
  )
}
