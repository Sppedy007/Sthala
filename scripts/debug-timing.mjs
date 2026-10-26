/**
 * Tests the new gemini-2.0-flash model with the trimmed prompt structure.
 * Run with: node scripts/debug-timing.mjs
 */
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
// Test both models to compare speed
// Try multiple models in order — first available wins
const models = [
  process.env.GEMMA_MODEL || "gemini-2.5-flash",
  "gemini-3.8-flash",
]

const ai = new GoogleGenAI({ apiKey })

// Simulate the trimmed payload (matches what buildPrompt now sends)
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
Use ONLY the provided numbers. Derive percentages from comparisons object.
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

DATA (JSON — use ONLY these numbers):
${JSON.stringify(payload)}

PRODUCE THIS JSON (no markdown fences, no extra text):
${schema}`

console.log(`Prompt length: ${prompt.length} chars (~${Math.round(prompt.length / 4)} tokens)`)
console.log()

for (const model of models) {
  const start = Date.now()
  console.log(`Testing model: ${model}`)
  try {
    const res = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        maxOutputTokens: 2048,
        thinkingConfig: { thinkingBudget: 0 },
      },
    })
    const elapsed = ((Date.now() - start) / 1000).toFixed(1)
    const text = res.text
    console.log(`✅ Success in ${elapsed}s`)
    console.log(`   finishReason: ${res.candidates?.[0]?.finishReason}`)
    console.log(`   output length: ${text?.length ?? 0} chars`)
    if (text) {
      // Try to parse as JSON
      try {
        const json = JSON.parse(text.trim().replace(/^```json\s*/, "").replace(/\s*```$/, ""))
        console.log(`   ✅ Valid JSON — keys: ${Object.keys(json).join(", ")}`)
        if (json.designAnalyses) {
          console.log(`   designAnalyses: ${json.designAnalyses.length} entries`)
        }
        if (json.bestRecommendation) {
          console.log(`   bestRecommendation: "${json.bestRecommendation.recommendedDesign}"`)
        }
      } catch (e) {
        console.log(`   ❌ Invalid JSON: ${e.message}`)
        console.log(`   Raw output (first 500 chars): ${text.slice(0, 500)}`)
      }
    }
  } catch (err) {
    const elapsed = ((Date.now() - start) / 1000).toFixed(1)
    console.log(`❌ Failed in ${elapsed}s: ${err.message}`)
  }
  console.log()
}
