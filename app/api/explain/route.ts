import { GoogleGenAI } from "@google/genai"
import { NextResponse } from "next/server"
import { analyzeSync } from "@/lib/analyze"
import { validateGemmaExplanation } from "@/lib/explain"
import { CLIMATES, FIELD_RULES } from "@/lib/scenarios"
import { MATERIALS } from "@/lib/materials"
import type { Climate, ShelterInput } from "@/lib/types"

export const runtime = "nodejs"
export const maxDuration = 60

// ---------------------------------------------------------------------------
// System instruction
// ---------------------------------------------------------------------------

const SYSTEM_INSTRUCTION = `You are the analysis and recommendation layer of Sthala, a shelter design comparison tool.

You receive:
1. The user's inputs (climate, dimensions, budget, materials, occupants).
2. Three shelter designs with exact calculated U-values, heat transfer (W) and cost (₹) from the deterministic engine.
3. The calculator's recommended design.
4. The full material catalogue with conductivity and pricing data.

YOUR ROLE:
- Explain and compare — do NOT recalculate. The thermal and cost numbers are already correct.
- For numerical claims: use ONLY the numbers provided. Derive percentages with ((new - base) / base) × 100.
- If you cannot compute a percentage from the provided data, write "insufficient data to quantify".
- Never invent conductivity values, prices or climate statistics.
- Clearly distinguish "estimated" model results from real-world outcomes.
- Recommend the BEST design for the user's specific budget and climate constraints, not simply the most insulated.

NUMERICAL ACCURACY RULES:
- Percentage reductions: ((higher_value - lower_value) / higher_value) × 100, rounded to nearest integer.
- Cost increases: ((expensive - cheap) / cheap) × 100, rounded to nearest integer.
- If outdoor temperature = target temperature, heat transfer is zero — acknowledge this.
- For budget-constrained users, the best design may be Budget, not High Insulation.

Output valid JSON only. No markdown fences, no surrounding commentary.`

// ---------------------------------------------------------------------------
// Input validation
// ---------------------------------------------------------------------------

function cleanJsonText(raw: string): string {
  let text = raw.trim()
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
  if (fenceMatch) {
    text = fenceMatch[1].trim()
  } else {
    const firstBrace = text.indexOf("{")
    const lastBrace = text.lastIndexOf("}")
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      text = text.substring(firstBrace, lastBrace + 1)
    }
  }
  return text.trim()
}

function validateShelterInput(
  data: unknown,
): { valid: true; input: ShelterInput } | { valid: false; error: string } {
  if (!data || typeof data !== "object") {
    return { valid: false, error: "Request body must be a JSON object" }
  }
  const d = data as Record<string, unknown>

  if (!CLIMATES.includes(d.climate as Climate)) {
    return { valid: false, error: `Invalid climate. Allowed: ${CLIMATES.join(", ")}` }
  }

  const numericFields: (keyof typeof FIELD_RULES)[] = [
    "outdoorTempC",
    "targetIndoorTempC",
    "lengthM",
    "widthM",
    "heightM",
    "occupants",
    "budgetINR",
    "openingAreaM2",
  ]

  for (const field of numericFields) {
    const val = d[field]
    if (typeof val !== "number" || Number.isNaN(val)) {
      return { valid: false, error: `${field} must be a valid number` }
    }
    const rule = FIELD_RULES[field]
    if (rule.integer && !Number.isInteger(val)) {
      return { valid: false, error: `${field} must be a whole number` }
    }
    if (val < rule.min || val > rule.max) {
      return { valid: false, error: `${field} must be between ${rule.min} and ${rule.max}` }
    }
  }

  if (
    typeof d.insulationThicknessMm !== "number" ||
    Number.isNaN(d.insulationThicknessMm) ||
    d.insulationThicknessMm < 0 ||
    d.insulationThicknessMm > 500
  ) {
    return { valid: false, error: "insulationThicknessMm must be a number between 0 and 500" }
  }

  // Validate material IDs exist in the catalogue
  const validIds = new Set(MATERIALS.map((m) => m.id))
  for (const field of ["wallMaterialId", "roofMaterialId", "insulationMaterialId"] as const) {
    if (!validIds.has(String(d[field]))) {
      return { valid: false, error: `${field} "${d[field]}" is not a recognised material` }
    }
  }

  const grossWallArea = 2 * (Number(d.lengthM) + Number(d.widthM)) * Number(d.heightM)
  if (Number(d.openingAreaM2) >= grossWallArea) {
    return {
      valid: false,
      error: `openingAreaM2 must be less than gross wall area (${grossWallArea.toFixed(1)} m²)`,
    }
  }

  return {
    valid: true,
    input: {
      climate: d.climate as Climate,
      outdoorTempC: Number(d.outdoorTempC),
      targetIndoorTempC: Number(d.targetIndoorTempC),
      lengthM: Number(d.lengthM),
      widthM: Number(d.widthM),
      heightM: Number(d.heightM),
      occupants: Number(d.occupants),
      budgetINR: Number(d.budgetINR),
      wallMaterialId: String(d.wallMaterialId),
      roofMaterialId: String(d.roofMaterialId),
      insulationMaterialId: String(d.insulationMaterialId),
      insulationThicknessMm: Number(d.insulationThicknessMm),
      openingAreaM2: Number(d.openingAreaM2),
    },
  }
}

// ---------------------------------------------------------------------------
// Gemma call with timeout
// ---------------------------------------------------------------------------

async function callGemmaWithTimeout(
  ai: GoogleGenAI,
  model: string,
  promptText: string,
  timeoutMs = 45000,
): Promise<string> {
  const generatePromise = ai.models.generateContent({
    model,
    contents: promptText,
    config: {
      maxOutputTokens: 4096,
    },
  })

  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error(`AI explanation request timed out after ${Math.round(timeoutMs / 1000)} seconds`)), timeoutMs),
  )

  const response = await Promise.race([generatePromise, timeoutPromise])
  const text = response.text
  if (!text) {
    throw new Error("Empty response received from AI model")
  }
  return text
}

// ---------------------------------------------------------------------------
// Build the prompt payload
// ---------------------------------------------------------------------------

function pct(a: number, b: number): string {
  if (b === 0) return "N/A (baseline is zero)"
  return `${Math.round(Math.abs((a - b) / b) * 100)}%`
}

function buildPrompt(input: ShelterInput, calculated: ReturnType<typeof analyzeSync>): string {
  const [budget, balanced, highIns] = calculated.designs

  // Pre-compute key comparison figures so Gemma can quote them exactly
  const heatMin = Math.min(...calculated.designs.map((d) => d.heatTransferW))
  const heatMax = Math.max(...calculated.designs.map((d) => d.heatTransferW))
  const costMin = Math.min(...calculated.designs.map((d) => d.estimatedCostINR))
  const costMax = Math.max(...calculated.designs.map((d) => d.estimatedCostINR))

  const designsForGemma = calculated.designs.map((d) => ({
    name: d.name,
    wallMaterial: d.wallMaterialId,
    roofMaterial: d.roofMaterialId,
    insulationMaterial: d.insulationMaterialId,
    insulationThicknessMm: d.insulationThicknessMm,
    uWall_WperM2K: parseFloat(d.uWall.toFixed(3)),
    uRoof_WperM2K: parseFloat(d.uRoof.toFixed(3)),
    totalHeat_W: Math.round(d.heatTransferW),
    heatDirection: d.heatDirection,
    estimatedCost_INR: Math.round(d.estimatedCostINR),
    withinBudget: d.estimatedCostINR <= input.budgetINR,
  }))

  const comparisons = {
    heatRange: {
      lowestHeat_W: Math.round(heatMin),
      highestHeat_W: Math.round(heatMax),
      lowestVsHighestReduction_pct: pct(heatMin, heatMax),
    },
    costRange: {
      lowestCost_INR: Math.round(costMin),
      highestCost_INR: Math.round(costMax),
      highestVsLowestIncrease_pct: pct(costMax, costMin),
    },
    budgetVsDesigns: calculated.designs.map((d) => ({
      name: d.name,
      budgetHeadroom_INR: Math.round(input.budgetINR - d.estimatedCostINR),
    })),
    balancedVsBudget: {
      heatReduction_pct: pct(balanced.heatTransferW, budget.heatTransferW),
      costIncrease_pct: pct(balanced.estimatedCostINR, budget.estimatedCostINR),
    },
    highInsVsBalanced: {
      heatReduction_pct: pct(highIns.heatTransferW, balanced.heatTransferW),
      costIncrease_pct: pct(highIns.estimatedCostINR, balanced.estimatedCostINR),
    },
    highInsVsBudget: {
      heatReduction_pct: pct(highIns.heatTransferW, budget.heatTransferW),
      costIncrease_pct: pct(highIns.estimatedCostINR, budget.estimatedCostINR),
    },
  }

  // Drop the full material catalogue and raw calc constants from the payload —
  // they add ~400 tokens without helping Gemma explain the already-computed results.
  const payload = {
    climate: input.climate,
    outdoorTempC: input.outdoorTempC,
    targetIndoorTempC: input.targetIndoorTempC,
    deltaT_C: calculated.geometry.deltaTC,
    dimensions: `${input.lengthM}×${input.widthM}×${input.heightM}m`,
    budgetINR: input.budgetINR,
    occupants: input.occupants,
    designs: designsForGemma,
    recommended: calculated.recommended,
    withinBudget: calculated.withinBudget,
    comparisons,
    warnings: calculated.warnings,
    note: "Steady-state conduction model. Excludes solar gain, thermal mass, wind, moisture.",
  }

  return `${SYSTEM_INSTRUCTION}

DATA (JSON — use ONLY these numbers):
${JSON.stringify(payload)}

PRODUCE THIS JSON (no markdown fences, no extra text):
{
  "summary": "string — 1-2 sentences covering the overall comparison",

  "designAnalyses": [
    {
      "designName": "Budget" | "Balanced" | "High Insulation",
      "advantages": ["string", ...],
      "limitations": ["string", ...],
      "improvements": [
        {
          "suggestion": "string — specific, actionable change",
          "quantifiedImpact": "string — use preComputedComparisons figures or write 'insufficient data to quantify'"
        }
      ]
    }
    // ... one entry for each of the three designs
  ],

  "bestRecommendation": {
    "recommendedDesign": "string — name of the best design for the user's specific constraints",
    "rationale": "string — why this design fits the budget, climate and constraints best",
    "constraintsSatisfied": ["string", ...],
    "tradeoffs": ["string", ...],
    "alternatives": [
      { "designName": "string", "summary": "string" }
    ]
  },

  "caveats": ["string", ...]
}

RULES:
- All percentage figures must come from preComputedComparisons or be calculable from the provided numbers.
- Do not invent any material property, price or climate figure.
- If ΔT is 0 or very small, note that heat transfer estimates are negligible.
- Keep advantages/limitations/improvements concise (max 2 sentences each).
- bestRecommendation.recommendedDesign should account for budget: if the user cannot afford High Insulation, do not recommend it as primary.
- Output valid JSON only. No markdown fences.`
}

// ---------------------------------------------------------------------------
// POST handler
// ---------------------------------------------------------------------------

export async function POST(req: Request) {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: "Server configuration error: GEMINI_API_KEY is not configured." },
      { status: 500 },
    )
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON in request body" }, { status: 400 })
  }

  const validation = validateShelterInput(body)
  if (!validation.valid) {
    return NextResponse.json({ error: validation.error }, { status: 400 })
  }

  const input = validation.input

  // Recompute deterministic results server-side so Gemma only sees trusted numbers
  const calculated = analyzeSync(input)

  const prompt = buildPrompt(input, calculated)

  const ai = new GoogleGenAI({ apiKey })
  // Primary model — set GEMMA_MODEL in .env.local to override (e.g. gemma-4-26b-a4b-it).
  // Default to gemini-3.1-flash-lite which returns valid structured JSON reliably in < 8s.
  const primaryModel = process.env.GEMMA_MODEL || "gemini-3.1-flash-lite"
  const fallbackModel = "gemini-3.5-flash"
  const modelOrder = primaryModel === fallbackModel
    ? [primaryModel]
    : [primaryModel, fallbackModel]

  let rawResponse = ""
  let lastError = "AI generation request failed"
  let succeeded = false
  let successfulModel = primaryModel

  for (const model of modelOrder) {
    try {
      rawResponse = await callGemmaWithTimeout(ai, model, prompt)
      successfulModel = model
      succeeded = true
      break
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      lastError = msg
      // Only retry on overload / unavailable / internal errors
      const isTransient = msg.includes("503") || msg.includes("500") || msg.includes("UNAVAILABLE") || msg.includes("overloaded") || msg.includes("high demand")
      if (!isTransient) break // hard error — don't try fallback
    }
  }

  if (!succeeded) {
    return NextResponse.json({ error: lastError }, { status: 504 })
  }

  let parsed: unknown
  let validated: ReturnType<typeof validateGemmaExplanation>

  try {
    parsed = JSON.parse(cleanJsonText(rawResponse))
    validated = validateGemmaExplanation(parsed)
  } catch {
    validated = { valid: false, error: "Response could not be parsed as JSON" }
  }

  // Retry once if invalid
  if (!validated.valid) {
    const initialError = validated.error
    try {
      const retryPrompt = `${prompt}

IMPORTANT: Your previous response failed schema validation: ${initialError}.
Return strictly valid JSON matching the schema above. No extra text, no markdown fences.`
      rawResponse = await callGemmaWithTimeout(ai, successfulModel, retryPrompt)
      parsed = JSON.parse(cleanJsonText(rawResponse))
      validated = validateGemmaExplanation(parsed)
    } catch {
      return NextResponse.json(
        { error: `AI explanation failed schema validation: ${initialError}` },
        { status: 502 },
      )
    }
  }

  if (!validated.valid) {
    return NextResponse.json(
      { error: `AI explanation failed schema validation: ${validated.error}` },
      { status: 502 },
    )
  }

  return NextResponse.json(validated.data)
}
