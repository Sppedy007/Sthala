/**
 * Trace two scenarios through analyzeSync and print human-readable output.
 * Run with: node --experimental-vm-modules scripts/trace-scenarios.mjs
 * (Or via tsx since the project uses TypeScript.)
 *
 * We re-implement the logic in plain JS here so we can run it without
 * a TypeScript compiler step. Numbers are taken from calc.ts / materials.ts
 * verbatim.
 */

// ---- Constants from calc.ts ----
const INSIDE_FILM_R = 0.13
const OUTSIDE_FILM_R = 0.04
const OPENING_U = 2.8
const AIR_CHANGES_PER_HOUR = 0.5
const AIR_HEAT_FACTOR = 0.33

// ---- Materials (subset needed for test, taken from materials.ts) ----
const MATERIALS = {
  // walls
  "adobe":           { id:"adobe",            name:"Adobe / Mud block",         category:"wall",        conductivityWPerMK:0.7,   thicknessMm:300, costPerM2INR:600  },
  "fired-brick":     { id:"fired-brick",       name:"Fired clay brick",          category:"wall",        conductivityWPerMK:0.7,   thicknessMm:230, costPerM2INR:900  },
  "stone":           { id:"stone",             name:"Stone masonry",             category:"wall",        conductivityWPerMK:1.7,   thicknessMm:350, costPerM2INR:1200 },
  "aac":             { id:"aac",               name:"AAC block",                 category:"wall",        conductivityWPerMK:0.16,  thicknessMm:200, costPerM2INR:1100 },
  "bamboo":          { id:"bamboo",            name:"Bamboo mat panel",          category:"wall",        conductivityWPerMK:0.17,  thicknessMm:20,  costPerM2INR:350  },
  // roofs
  "rcc":             { id:"rcc",               name:"RCC slab",                  category:"roof",        conductivityWPerMK:1.7,   thicknessMm:150, costPerM2INR:1800 },
  "timber-earth":    { id:"timber-earth",      name:"Timber-earth roof",         category:"roof",        conductivityWPerMK:0.5,   thicknessMm:200, costPerM2INR:1200 },
  "corrugated-metal":{ id:"corrugated-metal",  name:"Corrugated metal sheet",    category:"roof",        conductivityWPerMK:50,    thicknessMm:1,   costPerM2INR:400  },
  "thatch":          { id:"thatch",            name:"Thatch",                    category:"roof",        conductivityWPerMK:0.07,  thicknessMm:200, costPerM2INR:300  },
  // insulations
  "none":            { id:"none",              name:"No insulation",             category:"insulation",  conductivityWPerMK:999,   costPerM2PerCm:0 },
  "eps":             { id:"eps",               name:"EPS board",                 category:"insulation",  conductivityWPerMK:0.038, costPerM2PerCm:18 },
  "mineral-wool":    { id:"mineral-wool",      name:"Mineral wool batt",         category:"insulation",  conductivityWPerMK:0.04,  costPerM2PerCm:22 },
  "puf":             { id:"puf",               name:"PUF spray",                 category:"insulation",  conductivityWPerMK:0.026, costPerM2PerCm:35 },
  "aerogel":         { id:"aerogel",           name:"Aerogel blanket",           category:"insulation",  conductivityWPerMK:0.015, costPerM2PerCm:200 },
}

function getMaterial(id) {
  const m = MATERIALS[id]
  if (!m) throw new Error(`Unknown material: ${id}`)
  return m
}

function materialsByCategory(cat) {
  return Object.values(MATERIALS).filter(m => m.category === cat)
}

// ---- calc.ts functions ----
function layerResistance(thicknessMm, conductivity) {
  if (thicknessMm <= 0 || conductivity <= 0) return 0
  return (thicknessMm / 1000) / conductivity
}

function uValue(layers) {
  const layersR = layers.reduce((sum, l) => sum + layerResistance(l.thicknessMm, l.conductivity), 0)
  return 1 / (INSIDE_FILM_R + layersR + OUTSIDE_FILM_R)
}

function fabricHeat(parts, deltaTC) {
  return parts.reduce((sum, p) => sum + p.u * p.areaM2, 0) * deltaTC
}

function ventilationHeat(volumeM3, deltaTC) {
  return AIR_HEAT_FACTOR * AIR_CHANGES_PER_HOUR * volumeM3 * deltaTC
}

function heatDirection(targetC, outdoorC) {
  return outdoorC > targetC ? "gain" : "loss"
}

function computeGeometry(input) {
  const { lengthM: L, widthM: W, heightM: H, openingAreaM2 } = input
  const grossWallAreaM2 = 2 * (L + W) * H
  const wallAreaM2 = Math.max(0, grossWallAreaM2 - openingAreaM2)
  const roofAreaM2 = L * W
  return {
    grossWallAreaM2,
    wallAreaM2,
    roofAreaM2,
    floorAreaM2: L * W,
    volumeM3: L * W * H,
    openingAreaM2,
    deltaTC: Math.abs(input.targetIndoorTempC - input.outdoorTempC),
  }
}

function evaluateDesign(spec, geometry, input) {
  const wall = getMaterial(spec.wallMaterialId)
  const roof = getMaterial(spec.roofMaterialId)
  const insulation = getMaterial(spec.insulationMaterialId)
  const insulationMm = insulation.id === "none" ? 0 : spec.insulationThicknessMm

  const insulationLayer = { thicknessMm: insulationMm, conductivity: insulation.conductivityWPerMK }
  const uWall = uValue([
    { thicknessMm: wall.thicknessMm ?? 0, conductivity: wall.conductivityWPerMK },
    insulationLayer,
  ])
  const uRoof = uValue([
    { thicknessMm: roof.thicknessMm ?? 0, conductivity: roof.conductivityWPerMK },
    insulationLayer,
  ])

  const fabricHeatW = fabricHeat(
    [
      { u: uWall, areaM2: geometry.wallAreaM2 },
      { u: uRoof, areaM2: geometry.roofAreaM2 },
      { u: OPENING_U, areaM2: geometry.openingAreaM2 },
    ],
    geometry.deltaTC,
  )
  const ventilationHeatW = ventilationHeat(geometry.volumeM3, geometry.deltaTC)
  const heatTransferW = fabricHeatW + ventilationHeatW

  const wallCost = geometry.wallAreaM2 * (wall.costPerM2INR ?? 0)
  const roofCost = geometry.roofAreaM2 * (roof.costPerM2INR ?? 0)
  const insulatedArea = geometry.wallAreaM2 + geometry.roofAreaM2
  const insulationCost = insulatedArea * (insulationMm / 10) * (insulation.costPerM2PerCm ?? 0)
  const estimatedCostINR = wallCost + roofCost + insulationCost

  return {
    name: spec.name,
    wallMaterialId: spec.wallMaterialId,
    roofMaterialId: spec.roofMaterialId,
    insulationMaterialId: spec.insulationMaterialId,
    insulationThicknessMm: insulationMm,
    uWall, uRoof,
    fabricHeatW, ventilationHeatW, heatTransferW,
    heatDirection: heatDirection(input.targetIndoorTempC, input.outdoorTempC),
    estimatedCostINR,
  }
}

// ---- analyze.ts logic ----
function buildSpecs(input, geometry) {
  const walls = materialsByCategory("wall")
  const roofs = materialsByCategory("roof")
  const insulations = materialsByCategory("insulation").filter(m => m.id !== "none")

  const cheapest = list => [...list].sort(
    (a, b) => (a.costPerM2INR ?? a.costPerM2PerCm ?? 0) - (b.costPerM2INR ?? b.costPerM2PerCm ?? 0)
  )[0]
  const bestResistance = list => [...list].sort(
    (a, b) => (b.thicknessMm ?? 0) / b.conductivityWPerMK - (a.thicknessMm ?? 0) / a.conductivityWPerMK
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

function buildWarnings(input, geometry, designs) {
  const warnings = []
  const cheapestCost = Math.min(...designs.map(d => d.estimatedCostINR))
  if (input.budgetINR < cheapestCost) {
    warnings.push(`Budget (₹${input.budgetINR.toLocaleString("en-IN")}) is below cheapest design (₹${cheapestCost.toFixed(0)}).`)
  }
  if (input.insulationThicknessMm === 0 || input.insulationMaterialId === "none") {
    warnings.push("No insulation selected.")
  }
  if (geometry.grossWallAreaM2 > 0 && input.openingAreaM2 / geometry.grossWallAreaM2 > 0.25) {
    warnings.push("Openings cover more than 25% of the wall area.")
  }
  warnings.push("Material properties, prices and design-day temperatures are illustrative.")
  return warnings
}

function analyzeSync(input) {
  const geometry = computeGeometry(input)
  const designs = buildSpecs(input, geometry).map(spec => evaluateDesign(spec, geometry, input))

  const affordable = designs.filter(d => d.estimatedCostINR <= input.budgetINR)
  const withinBudget = affordable.length > 0
  const recommended = withinBudget
    ? [...affordable].sort((a, b) => a.heatTransferW - b.heatTransferW)[0]
    : [...designs].sort((a, b) => a.estimatedCostINR - b.estimatedCostINR)[0]

  return { designs, recommended: recommended.name, withinBudget, warnings: buildWarnings(input, geometry, designs), geometry }
}

// ---- Helpers ----
function fmt(n) { return n.toFixed(1) }
function fmtINR(n) { return "₹" + Math.round(n).toLocaleString("en-IN") }

function printResult(label, input, result) {
  console.log("\n" + "=".repeat(70))
  console.log(`SCENARIO: ${label}`)
  console.log("=".repeat(70))
  console.log(`  Geometry: ${input.lengthM}×${input.widthM}×${input.heightM}m | Vol=${fmt(result.geometry.volumeM3)}m³`)
  console.log(`  ΔT=${result.geometry.deltaTC}°C | Outdoor=${input.outdoorTempC}°C | Target=${input.targetIndoorTempC}°C`)
  console.log(`  Openings=${input.openingAreaM2}m² | Gross wall=${fmt(result.geometry.grossWallAreaM2)}m² | Budget=${fmtINR(input.budgetINR)}`)
  console.log()
  
  const heatSort = [...result.designs].sort((a, b) => a.heatTransferW - b.heatTransferW)
  const costSort = [...result.designs].sort((a, b) => a.estimatedCostINR - b.estimatedCostINR)
  
  for (const d of result.designs) {
    const isRec = d.name === result.recommended ? " ← RECOMMENDED" : ""
    console.log(`  [${d.name}]${isRec}`)
    console.log(`    Wall: ${d.wallMaterialId} | Roof: ${d.roofMaterialId} | Ins: ${d.insulationMaterialId} @ ${d.insulationThicknessMm}mm`)
    console.log(`    U-wall=${fmt(d.uWall)} | U-roof=${fmt(d.uRoof)}`)
    console.log(`    Heat ${d.heatDirection}: ${fmt(d.heatTransferW)}W (fabric=${fmt(d.fabricHeatW)}W, vent=${fmt(d.ventilationHeatW)}W)`)
    console.log(`    Cost: ${fmtINR(d.estimatedCostINR)}`)
  }

  console.log()
  console.log(`  CHECKS:`)
  
  const hiDesign = result.designs.find(d => d.name === "High Insulation")
  const budgetDesign = result.designs.find(d => d.name === "Budget")
  
  // 1. High Insulation has lowest heat transfer
  const hiIsLowest = heatSort[0].name === "High Insulation"
  console.log(`  ✓ High Insulation lowest heat? ${hiIsLowest ? "YES" : "NO — lowest is " + heatSort[0].name} (${fmt(hiDesign.heatTransferW)}W vs min ${fmt(heatSort[0].heatTransferW)}W)`)
  
  // 2. Budget has lowest cost
  const budgetIsLowest = costSort[0].name === "Budget"
  console.log(`  ✓ Budget lowest cost? ${budgetIsLowest ? "YES" : "NO — cheapest is " + costSort[0].name} (${fmtINR(budgetDesign.estimatedCostINR)} vs min ${fmtINR(costSort[0].estimatedCostINR)})`)
  
  // 3. Recommended is within budget or cheapest
  const recDesign = result.designs.find(d => d.name === result.recommended)
  const recWithinBudget = recDesign.estimatedCostINR <= input.budgetINR
  if (result.withinBudget) {
    console.log(`  ✓ Recommendation within budget? ${recWithinBudget ? "YES" : "NO"} (${result.recommended} = ${fmtINR(recDesign.estimatedCostINR)} ≤ ${fmtINR(input.budgetINR)})`)
  } else {
    console.log(`  ✓ Over budget, recommend cheapest? ${result.recommended === costSort[0].name ? "YES" : "NO"} (recommended=${result.recommended}, cheapest=${costSort[0].name})`)
  }
  
  // 4. Heat direction label
  const direction = input.outdoorTempC > input.targetIndoorTempC ? "gain" : "loss"
  const allCorrect = result.designs.every(d => d.heatDirection === direction)
  console.log(`  ✓ Heat direction="${direction}" correct for all designs? ${allCorrect ? "YES" : "NO"}`)
  
  // 5. Warnings
  console.log(`  ✓ Warnings (${result.warnings.length}):`)
  for (const w of result.warnings) console.log(`     - ${w}`)
}

// ---- Scenario A: Leh cold ----
const lehInput = {
  climate: "Leh",
  outdoorTempC: -15,
  targetIndoorTempC: 20,
  lengthM: 5, widthM: 4, heightM: 2.5,
  occupants: 4,
  budgetINR: 200000,
  wallMaterialId: "adobe",
  roofMaterialId: "timber-earth",
  insulationMaterialId: "mineral-wool",
  insulationThicknessMm: 100,
  openingAreaM2: 2,
}

// ---- Scenario B: Jaisalmer hot ----
const jaisalmerInput = {
  climate: "Jaisalmer",
  outdoorTempC: 47,
  targetIndoorTempC: 26,
  lengthM: 6, widthM: 4, heightM: 3,
  occupants: 5,
  budgetINR: 180000,
  wallMaterialId: "stone",
  roofMaterialId: "rcc",
  insulationMaterialId: "eps",
  insulationThicknessMm: 50,
  openingAreaM2: 2.5,
}

// ---- Edge cases ----
const zeroInsulationInput = {
  ...lehInput,
  insulationMaterialId: "none",
  insulationThicknessMm: 0,
}

const tinyBudgetInput = {
  ...jaisalmerInput,
  budgetINR: 10000,
}

const equalTempInput = {
  ...lehInput,
  outdoorTempC: 20,  // same as target
  targetIndoorTempC: 20,
}

const largeShelterInput = {
  ...lehInput,
  lengthM: 20, widthM: 15, heightM: 4,
  openingAreaM2: 10,
  budgetINR: 5000000,
}

printResult("Leh — Extreme Cold (preset)", lehInput, analyzeSync(lehInput))
printResult("Jaisalmer — Extreme Heat (preset)", jaisalmerInput, analyzeSync(jaisalmerInput))
printResult("Edge: Zero insulation (no-insulation warning expected)", zeroInsulationInput, analyzeSync(zeroInsulationInput))
printResult("Edge: Tiny budget ₹10,000 (over-budget, recommend cheapest)", tinyBudgetInput, analyzeSync(tinyBudgetInput))
printResult("Edge: Equal temperatures (near-zero heat transfer)", equalTempInput, analyzeSync(equalTempInput))
printResult("Edge: Large shelter 20×15×4m", largeShelterInput, analyzeSync(largeShelterInput))

console.log("\n" + "=".repeat(70))
console.log("All scenarios traced. See CHECKS above for pass/fail.")
console.log("=".repeat(70) + "\n")
