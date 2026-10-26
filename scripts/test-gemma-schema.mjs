/**
 * Verifies the mock Gemma response schema for the three required scenarios.
 * Run with: node scripts/test-gemma-schema.mjs
 * Tests that validateGemmaExplanation would accept a well-formed response.
 */

// ---- Re-implement the validator in plain JS ----

function isNonEmptyString(v) {
  return typeof v === "string" && v.trim() !== ""
}
function isStringArray(v) {
  return Array.isArray(v) && v.every((x) => typeof x === "string")
}
function validateDesignImprovement(obj) {
  if (!obj || typeof obj !== "object") return false
  return isNonEmptyString(obj.suggestion) && typeof obj.quantifiedImpact === "string"
}
function validateDesignAnalysis(obj) {
  if (!obj || typeof obj !== "object") return false
  return (
    isNonEmptyString(obj.designName) &&
    isStringArray(obj.advantages) &&
    isStringArray(obj.limitations) &&
    Array.isArray(obj.improvements) &&
    obj.improvements.every(validateDesignImprovement)
  )
}
function validateAlternative(obj) {
  if (!obj || typeof obj !== "object") return false
  return isNonEmptyString(obj.designName) && isNonEmptyString(obj.summary)
}
function validateBestRecommendation(obj) {
  if (!obj || typeof obj !== "object") return false
  return (
    isNonEmptyString(obj.recommendedDesign) &&
    isNonEmptyString(obj.rationale) &&
    isStringArray(obj.constraintsSatisfied) &&
    isStringArray(obj.tradeoffs) &&
    Array.isArray(obj.alternatives) &&
    obj.alternatives.every(validateAlternative)
  )
}
function validateGemmaExplanation(obj) {
  if (!obj || typeof obj !== "object") return { valid: false, error: "not an object" }
  if (!isNonEmptyString(obj.summary)) return { valid: false, error: "summary missing" }
  if (!Array.isArray(obj.designAnalyses) || obj.designAnalyses.length === 0)
    return { valid: false, error: "designAnalyses missing or empty" }
  for (let i = 0; i < obj.designAnalyses.length; i++) {
    if (!validateDesignAnalysis(obj.designAnalyses[i]))
      return { valid: false, error: `designAnalyses[${i}] invalid` }
  }
  if (!validateBestRecommendation(obj.bestRecommendation))
    return { valid: false, error: "bestRecommendation invalid" }
  if (!isStringArray(obj.caveats)) return { valid: false, error: "caveats must be string[]" }
  return { valid: true, data: obj }
}

// ---- Scenario 1: Low-budget shelter (Jaisalmer, budget ₹30k — all designs exceed it) ----
const lowBudgetResponse = {
  summary:
    "For a Jaisalmer shelter with a ₹30,000 budget, no design falls within budget. The Budget design at ₹30,993 is the closest feasible option despite exceeding the constraint.",
  designAnalyses: [
    {
      designName: "Budget",
      advantages: [
        "Lowest estimated material cost of the three at ₹30,993 — only ₹993 above the stated budget.",
        "Bamboo walls and thatch roof are locally available in many regions.",
      ],
      limitations: [
        "Highest estimated heat gain at 1,810 W, meaning significant cooling load in Jaisalmer's extreme heat.",
        "25 mm EPS insulation provides minimal resistance against a ΔT of 21 °C.",
      ],
      improvements: [
        {
          suggestion: "Increase EPS insulation from 25 mm to 50 mm on the roof.",
          quantifiedImpact:
            "Estimated heat gain reduction of ~18% vs the current Budget design, based on pre-computed comparisons between Budget and Balanced.",
        },
      ],
    },
    {
      designName: "Balanced",
      advantages: [
        "Stone walls provide high thermal mass, damping temperature swings in a desert climate.",
        "50 mm EPS insulation reduces estimated heat gain by ~21% compared to the Budget design.",
      ],
      limitations: [
        "Estimated cost of ₹1,19,535 is approximately 298% above the stated budget.",
        "Stone masonry has a high U-value (1.7 W/mK conductivity) despite its thickness.",
      ],
      improvements: [
        {
          suggestion: "Replace RCC roof with thatch to reduce roof heat gain significantly.",
          quantifiedImpact:
            "insufficient data to quantify without re-running the calculator, but thatch has a conductivity of 0.07 W/mK vs RCC at 1.6 W/mK.",
        },
      ],
    },
    {
      designName: "High Insulation",
      advantages: [
        "Lowest estimated heat gain at 598 W — a 67% reduction compared to the Budget design.",
        "AAC block (0.16 W/mK) combined with 100 mm aerogel insulation provides excellent thermal resistance.",
      ],
      limitations: [
        "Estimated cost of ₹2,33,450 exceeds the stated budget by approximately 678%.",
        "Aerogel blanket is a specialised material that may not be locally available in Rajasthan.",
      ],
      improvements: [
        {
          suggestion:
            "Substitute aerogel with mineral wool where cost or availability is a constraint.",
          quantifiedImpact:
            "Mineral wool at ₹55/m²/cm vs aerogel at ₹200/m²/cm would substantially reduce insulation cost; thermal performance would be slightly lower.",
        },
      ],
    },
  ],
  bestRecommendation: {
    recommendedDesign: "Budget",
    rationale:
      "With a ₹30,000 budget, no design is within budget. The Budget design at ₹30,993 is ₹993 over budget — the smallest shortfall. It is the only feasible option unless the budget is increased.",
    constraintsSatisfied: [
      "Closest to budget among all three designs.",
      "Uses bamboo and thatch, which are commonly available locally.",
    ],
    tradeoffs: [
      "Heat gain of 1,810 W will require ventilation or cooling support in Jaisalmer's extreme summer heat.",
      "Budget slightly exceeded by ₹993; user should explore local material sourcing to close the gap.",
    ],
    alternatives: [
      {
        designName: "Balanced",
        summary:
          "Reduces heat gain by ~21% vs Budget at a cost of ₹1,19,535 — feasible if budget can be increased to ₹1.2 lakh.",
      },
    ],
  },
  caveats: [
    "All thermal and cost figures are illustrative estimates from a steady-state model; solar gain, thermal mass and wind are not included.",
    "Material prices and availability vary by region; verify locally before purchasing.",
  ],
}

// ---- Scenario 2: Cold-climate shelter (Leh) ----
const coldClimateResponse = {
  summary:
    "For Leh with a ΔT of 35 °C, heat loss is the primary concern. The Balanced design offers the best thermal-to-cost trade-off within the ₹2,00,000 budget.",
  designAnalyses: [
    {
      designName: "Budget",
      advantages: [
        "Lowest estimated cost at ₹23,885 — well within the ₹2,00,000 budget.",
        "Thatch roof provides reasonable insulation (0.07 W/mK conductivity).",
      ],
      limitations: [
        "Estimated heat loss of 2,266 W is the highest of the three designs.",
        "Bamboo mat walls with only 25 mm EPS insulation provide inadequate protection at −15 °C outdoor temperature.",
      ],
      improvements: [
        {
          suggestion: "Increase EPS insulation from 25 mm to 100 mm on walls and roof.",
          quantifiedImpact:
            "Moving from Budget to Balanced with mineral-wool 100 mm reduces estimated heat loss by ~47%, based on 2,266 W vs 1,199 W.",
        },
      ],
    },
    {
      designName: "Balanced",
      advantages: [
        "Adobe walls (0.6 W/mK, 300 mm) provide good thermal mass for a cold-desert climate.",
        "100 mm mineral wool reduces heat loss by ~47% compared to the Budget design.",
      ],
      limitations: [
        "Not as thermally efficient as High Insulation — heat loss is still 1,199 W.",
        "Mineral wool must be kept dry; adobe walls require protection from rain and freeze-thaw cycles.",
      ],
      improvements: [
        {
          suggestion: "Add a vapour-control layer behind the mineral wool insulation.",
          quantifiedImpact:
            "insufficient data to quantify — prevents moisture degradation of insulation; maintains rated performance.",
        },
      ],
    },
    {
      designName: "High Insulation",
      advantages: [
        "Lowest heat loss at 670 W — a 70% reduction vs Budget and 44% vs Balanced.",
        "Aerogel at 150 mm (0.015 W/mK) provides the best insulation performance available in the catalogue.",
      ],
      limitations: [
        "Estimated cost of ₹2,42,300 exceeds the ₹2,00,000 budget by ₹42,300 (21%).",
        "Aerogel may not be locally available in Leh; logistics in a remote cold-desert region can be difficult.",
      ],
      improvements: [
        {
          suggestion: "Substitute aerogel with mineral wool and increase thickness to 200 mm.",
          quantifiedImpact:
            "Mineral wool at ₹55/m²/cm is significantly cheaper than aerogel at ₹200/m²/cm; heat performance would be intermediate between Balanced and High Insulation.",
        },
      ],
    },
  ],
  bestRecommendation: {
    recommendedDesign: "Balanced",
    rationale:
      "The Balanced design (adobe walls, timber-earth roof, 100 mm mineral wool) costs ₹63,660 — well within the ₹2,00,000 budget — and reduces heat loss by ~47% compared to Budget. High Insulation is over budget. Balanced is the best trade-off between thermal performance and affordability for Leh.",
    constraintsSatisfied: [
      "Within the ₹2,00,000 budget with ₹1,36,340 to spare.",
      "Adobe walls and timber-earth roof are traditional materials suited to the Himalayan climate.",
      "47% heat-loss reduction over Budget improves thermal comfort at −15 °C.",
    ],
    tradeoffs: [
      "Still loses ~1,199 W; supplementary heating will likely be needed.",
      "Adobe walls are sensitive to moisture; waterproofing must be maintained.",
    ],
    alternatives: [
      {
        designName: "High Insulation",
        summary:
          "Reduces heat loss by 44% vs Balanced, but costs ₹42,300 above budget. Feasible if budget is extended to ₹2.5 lakh.",
      },
    ],
  },
  caveats: [
    "Steady-state model only; actual heat loss at Leh will vary with wind speed, solar radiation and thermal mass.",
    "Material availability in Leh may differ from other regions; verify with local suppliers.",
  ],
}

// ---- Scenario 3: Material unavailable (preferred insulation aerogel unavailable) ----
const materialConstrainedResponse = {
  summary:
    "When aerogel is unavailable, mineral wool at 150 mm is the next best insulation option and provides a good balance of thermal performance and cost.",
  designAnalyses: [
    {
      designName: "Budget",
      advantages: [
        "Cheapest option using widely available bamboo and thatch.",
        "Suitable if budget is severely constrained and thermal performance is a secondary priority.",
      ],
      limitations: [
        "25 mm EPS insulation provides very little resistance at high ΔT values.",
        "Not a good long-term choice in extreme climates.",
      ],
      improvements: [
        {
          suggestion: "Upgrade to 50 mm EPS or 50 mm mineral wool insulation.",
          quantifiedImpact:
            "Based on Balanced vs Budget comparison, heat transfer is reduced by approximately 21-47% depending on the climate.",
        },
      ],
    },
    {
      designName: "Balanced",
      advantages: [
        "Uses the user's preferred materials with at least 50 mm insulation.",
        "Good middle ground between Budget and High Insulation.",
      ],
      limitations: [
        "If aerogel is the user's preferred insulation, the Balanced design defaults to EPS or mineral wool.",
        "Neither EPS nor mineral wool achieves aerogel's 0.015 W/mK conductivity.",
      ],
      improvements: [
        {
          suggestion: "Use mineral wool at 100 mm instead of EPS at 50 mm where fire safety matters.",
          quantifiedImpact:
            "Mineral wool (0.04 W/mK) vs EPS (0.036 W/mK) gives similar thermal performance; mineral wool is non-combustible.",
        },
      ],
    },
    {
      designName: "High Insulation",
      advantages: [
        "AAC block walls (0.16 W/mK) offer excellent insulation without relying on aerogel.",
        "If mineral wool at 150 mm substitutes for aerogel, the design remains thermally strong.",
      ],
      limitations: [
        "Aerogel at 150 mm achieves 0.015 W/mK; substituting mineral wool (0.04 W/mK) increases heat transfer.",
        "Cost-to-performance ratio drops when substituting aerogel with pricier-per-Watt alternatives.",
      ],
      improvements: [
        {
          suggestion: "Use PUF spray foam (0.026 W/mK, ₹35/m²/cm) as an intermediate substitution for aerogel.",
          quantifiedImpact:
            "PUF at 150 mm achieves a conductivity closer to aerogel than mineral wool; cost would be ₹35×15 = ₹525/m² vs aerogel at ₹3,000/m².",
        },
      ],
    },
  ],
  bestRecommendation: {
    recommendedDesign: "High Insulation (with mineral wool substitution)",
    rationale:
      "Since aerogel is unavailable, the High Insulation design should substitute aerogel with mineral wool at 150 mm or PUF spray at 150 mm. This retains AAC block walls (best available thermal wall) and thatch roof, giving the best achievable thermal performance with available materials.",
    constraintsSatisfied: [
      "Uses only materials available in the catalogue (aerogel excluded).",
      "AAC block and thatch are both listed and available.",
      "Mineral wool or PUF substitution maintains good thermal resistance.",
    ],
    tradeoffs: [
      "Substituting mineral wool for aerogel increases heat transfer compared to the original High Insulation design.",
      "Exact performance impact cannot be quantified without re-running the calculator with the substitute material.",
    ],
    alternatives: [
      {
        designName: "Balanced with mineral wool 100 mm",
        summary:
          "Simpler build using the user's chosen wall/roof materials with mineral wool — a good option if AAC block is also hard to source.",
      },
      {
        designName: "High Insulation with PUF spray",
        summary:
          "PUF spray (0.026 W/mK) outperforms mineral wool thermally and costs less than aerogel; a strong intermediate choice.",
      },
    ],
  },
  caveats: [
    "Material substitutions change U-values; re-run the calculator with the substitute material ID to get accurate thermal and cost estimates.",
    "All values are illustrative estimates from a steady-state model.",
  ],
}

// ---- Run validation ----
const scenarios = [
  { name: "Low-budget shelter (Jaisalmer ₹30k)", response: lowBudgetResponse },
  { name: "Cold-climate shelter (Leh)", response: coldClimateResponse },
  { name: "Material-constrained (aerogel unavailable)", response: materialConstrainedResponse },
]

let allPassed = true
for (const { name, response } of scenarios) {
  const result = validateGemmaExplanation(response)
  if (result.valid) {
    console.log(`✅ PASS: ${name}`)
    console.log(`   summary: "${response.summary.slice(0, 80)}…"`)
    console.log(
      `   designAnalyses: ${response.designAnalyses.length} designs, ${response.designAnalyses.reduce((s, d) => s + d.improvements.length, 0)} improvements total`,
    )
    console.log(`   bestRecommendation: "${response.bestRecommendation.recommendedDesign}"`)
    console.log(
      `   alternatives: ${response.bestRecommendation.alternatives.length} | caveats: ${response.caveats.length}`,
    )
  } else {
    console.log(`❌ FAIL: ${name} — ${result.error}`)
    allPassed = false
  }
  console.log()
}

if (allPassed) {
  console.log("All schema validation tests passed. The validator accepts well-formed Gemma responses.")
} else {
  console.log("Some tests failed. Fix the validator or response structure.")
  process.exit(1)
}
