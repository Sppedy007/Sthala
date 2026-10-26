// Shared TypeScript types for Sthala.
// The first block matches the brief exactly; the extra fields below
// (geometry, breakdown, etc.) were added so the UI can show every number
// without importing calc.ts directly.

export type Climate = "Leh" | "Delhi" | "Jaisalmer"

export type ShelterInput = {
  climate: Climate
  outdoorTempC: number
  targetIndoorTempC: number
  lengthM: number
  widthM: number
  heightM: number
  occupants: number
  budgetINR: number
  wallMaterialId: string
  roofMaterialId: string
  insulationMaterialId: string
  insulationThicknessMm: number
  openingAreaM2: number
}

export type DesignName = "Budget" | "Balanced" | "High Insulation"

export type MaterialCategory = "wall" | "roof" | "insulation"

export type Material = {
  id: string
  name: string
  category: MaterialCategory
  /** Thermal conductivity k in W/mK (lower = better insulator). */
  conductivityWPerMK: number
  /** Typical built thickness for walls and roofs, in mm. */
  thicknessMm?: number
  /** Walls and roofs: illustrative cost per m² of built element, in ₹. */
  costPerM2INR?: number
  /** Insulation: illustrative cost per m² for every 1 cm of thickness, in ₹. */
  costPerM2PerCm?: number
  notes: string
}

/** One row of the material breakdown table. */
export type MaterialLine = {
  role: "Wall" | "Roof" | "Insulation"
  materialId: string
  materialName: string
  thicknessMm: number
  areaM2: number
  conductivityWPerMK: number
  costINR: number
  costSharePct: number
}

export type Geometry = {
  grossWallAreaM2: number
  wallAreaM2: number
  roofAreaM2: number
  floorAreaM2: number
  volumeM3: number
  openingAreaM2: number
  deltaTC: number
}

export type DesignResult = {
  name: DesignName
  wallMaterialId: string
  roofMaterialId: string
  insulationMaterialId: string
  insulationThicknessMm: number
  uWall: number
  uRoof: number
  heatTransferW: number
  heatDirection: "loss" | "gain"
  estimatedCostINR: number
  advantages: string[]
  disadvantages: string[]
  plainSummary: string
  // Extra detail for the UI
  uOpening: number
  fabricHeatW: number
  ventilationHeatW: number
  heatPerFloorM2: number
  breakdown: MaterialLine[]
}

export type ReasonBasedOn = "calculated" | "input" | "general_knowledge"

// ---- Feature 1: per-design AI analysis ----

export type DesignImprovement = {
  /** Specific change that could be made. */
  suggestion: string
  /**
   * Quantified impact in plain English.
   * Must be calculated from actual model numbers or say "insufficient data to quantify".
   * Example: "reduces estimated heat loss by ~18% vs the Balanced design"
   */
  quantifiedImpact: string
}

export type DesignAnalysis = {
  designName: DesignName
  advantages: string[]
  limitations: string[]
  improvements: DesignImprovement[]
}

// ---- Feature 2: AI-powered best recommendation ----

export type RecommendationAlternative = {
  designName: string
  summary: string
}

export type BestRecommendation = {
  /** One of the three design names, or a hybrid description. */
  recommendedDesign: string
  /** Why this design wins given the user's constraints. */
  rationale: string
  /** List of user constraints that are satisfied. */
  constraintsSatisfied: string[]
  /** Compromises the user must accept. */
  tradeoffs: string[]
  /** Up to two alternatives if primary materials/budget unavailable. */
  alternatives: RecommendationAlternative[]
}

export type GemmaExplanation = {
  /** One or two sentence overall summary of the comparison. */
  summary: string
  /** Per-design analysis — one entry for each of the three designs. */
  designAnalyses: DesignAnalysis[]
  /** The AI-powered best recommendation for the user's constraints. */
  bestRecommendation: BestRecommendation
  /** Caveats about model limitations that apply to all designs. */
  caveats: string[]
}

export type AdvisorStatus = "idle" | "loading" | "success" | "error"

export type AdvisorState = {
  status: AdvisorStatus
  data: GemmaExplanation | null
  error?: string | null
}

export type AnalysisResult = {
  designs: DesignResult[]
  recommended: DesignName
  withinBudget: boolean
  warnings: string[]
  advisor: GemmaExplanation | null
  meta: { generatedAt: string; assumptionsVersion: string }
  // Extra detail for the UI
  input: ShelterInput
  geometry: Geometry
}

/** Form values are kept as strings so the user can type freely; validated before use. */
export type FormState = {
  climate: Climate
  outdoorTempC: string
  targetIndoorTempC: string
  lengthM: string
  widthM: string
  heightM: string
  occupants: string
  budgetINR: string
  wallMaterialId: string
  roofMaterialId: string
  insulationMaterialId: string
  insulationThicknessMm: number
  openingAreaM2: string
}
