import { formatINR, formatU, formatW } from "./format"
import { materialName } from "./materials"
import type { AnalysisResult, GemmaExplanation } from "./types"

/** Plain-text report for "Copy report" and "Share". */
export function buildReport(result: AnalysisResult, advisor?: GemmaExplanation | null): string {
  const { input, geometry } = result
  const gemma = advisor ?? result.advisor

  const lines = [
    "Sthala — shelter comparison (indicative estimates)",
    `Climate: ${input.climate} · outdoor ${input.outdoorTempC} °C · target ${input.targetIndoorTempC} °C (ΔT ${geometry.deltaTC} °C)`,
    `Size: ${input.lengthM} × ${input.widthM} × ${input.heightM} m · ${input.occupants} occupants · budget ${formatINR(input.budgetINR)}`,
    "",
    `Recommended: ${result.recommended}${result.withinBudget ? "" : " (over budget)"}`,
    "",
    ...result.designs.flatMap((d) => [
      `${d.name}`,
      `  Wall: ${materialName(d.wallMaterialId)} · Roof: ${materialName(d.roofMaterialId)} · Insulation: ${materialName(d.insulationMaterialId)} ${d.insulationThicknessMm} mm`,
      `  U-wall ${formatU(d.uWall)} · U-roof ${formatU(d.uRoof)} · heat ${d.heatDirection} ${formatW(d.heatTransferW)} · cost ${formatINR(d.estimatedCostINR)}`,
    ]),
  ]

  if (gemma) {
    lines.push("", "--- AI Analysis (Gemma) ---", `Summary: ${gemma.summary}`, "")

    // Feature 1: per-design analysis
    for (const da of gemma.designAnalyses) {
      lines.push(`[${da.designName}]`)
      lines.push("  Advantages:")
      for (const a of da.advantages) lines.push(`    + ${a}`)
      lines.push("  Limitations:")
      for (const l of da.limitations) lines.push(`    - ${l}`)
      if (da.improvements.length > 0) {
        lines.push("  Suggested improvements:")
        for (const i of da.improvements)
          lines.push(`    → ${i.suggestion} (${i.quantifiedImpact})`)
      }
      lines.push("")
    }

    // Feature 2: best recommendation
    const rec = gemma.bestRecommendation
    lines.push(
      "--- Gemma's Best Recommendation ---",
      `Recommended design: ${rec.recommendedDesign}`,
      `Rationale: ${rec.rationale}`,
    )
    if (rec.constraintsSatisfied.length > 0) {
      lines.push("Constraints satisfied:")
      for (const c of rec.constraintsSatisfied) lines.push(`  ✓ ${c}`)
    }
    if (rec.tradeoffs.length > 0) {
      lines.push("Trade-offs:")
      for (const t of rec.tradeoffs) lines.push(`  • ${t}`)
    }
    if (rec.alternatives.length > 0) {
      lines.push("Alternatives:")
      for (const alt of rec.alternatives) lines.push(`  • ${alt.designName}: ${alt.summary}`)
    }

    if (gemma.caveats.length > 0) {
      lines.push("", "Caveats:")
      for (const c of gemma.caveats) lines.push(`  • ${c}`)
    }
  }

  lines.push(
    "",
    "Material data and prices are illustrative. Estimates only. Not certified engineering advice.",
  )

  return lines.join("\n")
}
