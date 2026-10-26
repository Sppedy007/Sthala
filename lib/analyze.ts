// The single entry point the UI uses to get deterministic calculation results.
// Numbers come from real (simplified) formulas in calc.ts.

import { computeGeometry, evaluateDesign, type DesignSpec } from "./calc"
import { formatINR, formatW } from "./format"
import { materialsByCategory } from "./materials"
import type { AnalysisResult, DesignName, DesignResult, Geometry, ShelterInput } from "./types"

export const ASSUMPTIONS_VERSION = "2026.10-steady-state-v1"

/** Pick the three design options from the user's input. */
function buildSpecs(input: ShelterInput, geometry: Geometry): DesignSpec[] {
  const walls = materialsByCategory("wall")
  const roofs = materialsByCategory("roof")
  const insulations = materialsByCategory("insulation").filter((m) => m.id !== "none")

  const cheapest = <T extends { costPerM2INR?: number; costPerM2PerCm?: number }>(list: T[]) =>
    [...list].sort(
      (a, b) => (a.costPerM2INR ?? a.costPerM2PerCm ?? 0) - (b.costPerM2INR ?? b.costPerM2PerCm ?? 0),
    )[0]
  // "Best" wall/roof = highest resistance at its typical thickness (thickness / k).
  const bestResistance = <T extends { thicknessMm?: number; conductivityWPerMK: number }>(list: T[]) =>
    [...list].sort(
      (a, b) => (b.thicknessMm ?? 0) / b.conductivityWPerMK - (a.thicknessMm ?? 0) / a.conductivityWPerMK,
    )[0]
  const lowestK = [...insulations].sort((a, b) => a.conductivityWPerMK - b.conductivityWPerMK)[0]

  const userInsulation = input.insulationMaterialId === "none" ? "eps" : input.insulationMaterialId
  const highThickness = Math.min(200, Math.max(input.insulationThicknessMm, geometry.deltaTC >= 25 ? 150 : 100))

  return [
    {
      name: "Budget",
      wallMaterialId: cheapest(walls).id,
      roofMaterialId: cheapest(roofs).id,
      insulationMaterialId: cheapest(insulations).id,
      insulationThicknessMm: 25,
    },
    {
      name: "Balanced",
      wallMaterialId: input.wallMaterialId,
      roofMaterialId: input.roofMaterialId,
      insulationMaterialId: userInsulation,
      insulationThicknessMm: Math.max(50, input.insulationThicknessMm),
    },
    {
      name: "High Insulation",
      wallMaterialId: bestResistance(walls).id,
      roofMaterialId: bestResistance(roofs).id,
      insulationMaterialId: lowestK.id,
      insulationThicknessMm: highThickness,
    },
  ]
}

const PROS_CONS: Record<DesignName, { advantages: string[]; disadvantages: string[] }> = {
  Budget: {
    advantages: ["Lowest estimated material cost of the three.", "Uses simple, widely available materials."],
    disadvantages: ["Thin insulation lets more heat through.", "Earth and thatch may need more upkeep over time."],
  },
  Balanced: {
    advantages: ["Built around the materials you selected.", "Middle ground between cost and comfort."],
    disadvantages: ["Not the cheapest option.", "Not the best thermal performance either."],
  },
  "High Insulation": {
    advantages: ["Lowest estimated heat transfer of the three.", "Thick insulation may reduce heating or cooling needs."],
    disadvantages: ["Highest estimated material cost.", "Thicker layers need careful detailing and dry storage."],
  },
}

/** A no-jargon sentence explaining what the watts mean. */
function plainSummary(heatW: number, direction: "loss" | "gain"): string {
  const kw = heatW / 1000
  const rounded = Math.max(1, Math.round(kw))
  if (heatW < 50) return "The indoor and outdoor temperatures are close, so very little heat may flow either way."
  return direction === "loss"
    ? `On a design day this shelter may lose about ${formatW(heatW)} — roughly what ${rounded} small room heater${rounded === 1 ? "" : "s"} (1 kW each) would need to replace.`
    : `On a design day this shelter may gain about ${formatW(heatW)} of heat — roughly ${kw.toFixed(1)} kW of cooling may be needed to hold your target.`
}

function buildWarnings(input: ShelterInput, geometry: Geometry, designs: DesignResult[]): string[] {
  const warnings: string[] = []
  const cheapestCost = Math.min(...designs.map((d) => d.estimatedCostINR))
  if (input.budgetINR < cheapestCost) {
    warnings.push(
      `Your budget (${formatINR(input.budgetINR)}) is below the cheapest estimated design (${formatINR(cheapestCost)}).`,
    )
  }
  if (input.insulationThicknessMm === 0 || input.insulationMaterialId === "none") {
    warnings.push(
      "No insulation selected. The Balanced design assumes at least 50 mm of EPS board so it can be compared fairly.",
    )
  }
  if (geometry.grossWallAreaM2 > 0 && input.openingAreaM2 / geometry.grossWallAreaM2 > 0.25) {
    warnings.push("Openings cover more than 25% of the wall area. Large openings may increase heat transfer noticeably.")
  }
  warnings.push("Material properties, prices and design-day temperatures are illustrative. Verify them locally.")
  return warnings
}

/**
 * Synchronous core of the analysis. Exported so mock data (history) can use the
 * exact same numbers. The UI should call `analyze()` instead.
 */
export function analyzeSync(input: ShelterInput, generatedAt = new Date().toISOString()): AnalysisResult {
  const geometry = computeGeometry(input)

  const designs: DesignResult[] = buildSpecs(input, geometry).map((spec) => {
    const evaluated = evaluateDesign(spec, geometry, input)
    return {
      ...evaluated,
      ...PROS_CONS[spec.name],
      plainSummary: plainSummary(evaluated.heatTransferW, evaluated.heatDirection),
    }
  })

  // Recommendation: lowest heat transfer among designs within budget,
  // otherwise the cheapest design (flagged as over budget).
  const affordable = designs.filter((d) => d.estimatedCostINR <= input.budgetINR)
  const withinBudget = affordable.length > 0
  const recommendedDesign = withinBudget
    ? [...affordable].sort((a, b) => a.heatTransferW - b.heatTransferW)[0]
    : [...designs].sort((a, b) => a.estimatedCostINR - b.estimatedCostINR)[0]

  return {
    designs,
    recommended: recommendedDesign.name,
    withinBudget,
    warnings: buildWarnings(input, geometry, designs),
    advisor: null,
    meta: { generatedAt, assumptionsVersion: ASSUMPTIONS_VERSION },
    input,
    geometry,
  }
}

/**
 * Synchronous deterministic calculation.
 * Produces designs, recommendation, warnings, and geometry immediately.
 */
export function analyze(input: ShelterInput): AnalysisResult {
  return analyzeSync(input)
}
