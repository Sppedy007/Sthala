"use client"

import { SCENARIOS, type Scenario } from "@/lib/scenarios"

export function ScenarioChips({ onSelect }: { onSelect: (scenario: Scenario) => void }) {
  return (
    <div role="group" aria-label="Example scenarios" className="flex flex-wrap gap-2">
      {SCENARIOS.map((scenario) => (
        <button
          key={scenario.id}
          type="button"
          onClick={() => onSelect(scenario)}
          title={scenario.description}
          className="min-h-11 rounded-full border border-white/10 bg-white/[0.04] px-4 text-sm font-medium text-white/85 transition-colors hover:border-white/25 hover:bg-white/[0.08]"
        >
          {scenario.label}
        </button>
      ))}
    </div>
  )
}
