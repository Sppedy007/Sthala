import { GoogleGenAI } from "@google/genai"
import { readFileSync } from "fs"

try {
  const envContent = readFileSync(".env.local", "utf8")
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim()
    if (trimmed && !trimmed.startsWith("#")) {
      const idx = trimmed.indexOf("=")
      if (idx > 0) {
        process.env[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim()
      }
    }
  }
} catch {}

const apiKey = process.env.GEMINI_API_KEY
const ai = new GoogleGenAI({ apiKey })

const payload = {
  climate: "Leh",
  outdoorTempC: -15,
  targetIndoorTempC: 20,
  deltaT_C: 35,
  dimensions: "5×4×2.5m",
  budgetINR: 200000,
  occupants: 4,
  designs: [
    { name: "Budget", wallMaterial: "bamboo", roofMaterial: "thatch", insulationMaterial: "eps", insulationThicknessMm: 25, uWall_WperM2K: 1.09, uRoof_WperM2K: 0.28, totalHeat_W: 2266, heatDirection: "loss", estimatedCost_INR: 23885, withinBudget: true },
    { name: "Balanced", wallMaterial: "adobe", roofMaterial: "timber-earth", insulationMaterial: "mineral-wool", insulationThicknessMm: 100, uWall_WperM2K: 0.27, uRoof_WperM2K: 0.27, totalHeat_W: 1199, heatDirection: "loss", estimatedCost_INR: 63660, withinBudget: true },
    { name: "High Insulation", wallMaterial: "aac", roofMaterial: "thatch", insulationMaterial: "straw-bale", insulationThicknessMm: 150, uWall_WperM2K: 0.10, uRoof_WperM2K: 0.10, totalHeat_W: 670, heatDirection: "loss", estimatedCost_INR: 242300, withinBudget: false },
  ],
  recommended: "Balanced",
  withinBudget: true,
  comparisons: {
    balancedVsBudget: { heatReduction_pct: "47%", costIncrease_pct: "166%" },
    highInsVsBalanced: { heatReduction_pct: "44%", costIncrease_pct: "281%" },
    highInsVsBudget: { heatReduction_pct: "70%", costIncrease_pct: "915%" },
  },
  warnings: ["Material properties, prices and design-day temperatures are illustrative."],
  note: "Steady-state conduction model. Excludes solar gain, thermal mass, wind, moisture.",
}

const SYSTEM_INSTRUCTION = `You are the analysis and recommendation layer of Sthala, a shelter design comparison tool.
You receive user inputs and three calculated shelter designs. Explain and compare them.
Use ONLY the provided numbers.
Recommend the best design for the user's budget and climate.
Output valid JSON only. No markdown fences.`

const schema = `{
  "summary": "string",
  "designAnalyses": [
    {"designName": "Budget|Balanced|High Insulation", "advantages": ["string"], "limitations": ["string"], "improvements": [{"suggestion": "string", "quantifiedImpact": "string"}]}
  ],
  "bestRecommendation": {
    "recommendedDesign": "string",
    "rationale": "string",
    "constraintsSatisfied": ["string"],
    "tradeoffs": ["string"],
    "alternatives": [{"designName": "string", "summary": "string"}]
  },
  "caveats": ["string"]
}`

const prompt = `${SYSTEM_INSTRUCTION}

DATA:
${JSON.stringify(payload)}

PRODUCE THIS JSON SCHEMA (strictly valid JSON, no markdown code block fences):
${schema}`

// Test gemma without responseMimeType, and gemini-3.1-flash-lite, and gemini-3.5-flash with 8192 tokens
const tests = [
  { model: "gemma-4-26b-a4b-it", config: { maxOutputTokens: 4096 } },
  { model: "gemini-3.1-flash-lite", config: { maxOutputTokens: 4096 } },
  { model: "gemini-3.5-flash", config: { maxOutputTokens: 8192 } },
]

for (const { model, config } of tests) {
  const t0 = Date.now()
  try {
    const res = await ai.models.generateContent({
      model,
      contents: prompt,
      config,
    })
    const sec = ((Date.now() - t0) / 1000).toFixed(2)
    const raw = res.text?.trim() || ""
    const clean = raw.replace(/^```json\s*/, "").replace(/\s*```$/, "")
    const parsed = JSON.parse(clean)
    console.log(`[PASS] ${model} in ${sec}s! Valid JSON!`)
    console.log(`       Recommendation: ${parsed.bestRecommendation?.recommendedDesign}`)
  } catch (e) {
    console.log(`[FAIL] ${model} in ${((Date.now() - t0) / 1000).toFixed(2)}s:`, e.message?.slice(0, 150))
  }
}
