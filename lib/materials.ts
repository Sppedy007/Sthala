import type { Material, MaterialCategory } from "./types"

// ILLUSTRATIVE – verify locally.
// Conductivity values are rough textbook-range figures; prices are placeholder
// Indian-rupee estimates for material + basic labour. Real values vary a lot by
// region, supplier, moisture content and workmanship.
export const MATERIALS: Material[] = [
  // ---- Walls ----
  {
    id: "adobe",
    name: "Adobe / mud brick",
    category: "wall",
    conductivityWPerMK: 0.6,
    thicknessMm: 300,
    costPerM2INR: 900,
    notes: "Locally available earth; good thermal mass, sensitive to heavy rain.",
  },
  {
    id: "fired-brick",
    name: "Fired clay brick",
    category: "wall",
    conductivityWPerMK: 0.72,
    thicknessMm: 230,
    costPerM2INR: 1400,
    notes: "Common and durable; moderate insulation on its own.",
  },
  {
    id: "stone",
    name: "Local stone masonry",
    category: "wall",
    conductivityWPerMK: 1.7,
    thicknessMm: 400,
    costPerM2INR: 1800,
    notes: "Very durable with high thermal mass, but conducts heat readily.",
  },
  {
    id: "concrete-block",
    name: "Hollow concrete block",
    category: "wall",
    conductivityWPerMK: 1.1,
    thicknessMm: 200,
    costPerM2INR: 1100,
    notes: "Fast to build; usually needs added insulation in harsh climates.",
  },
  {
    id: "aac",
    name: "AAC block",
    category: "wall",
    conductivityWPerMK: 0.16,
    thicknessMm: 200,
    costPerM2INR: 1600,
    notes: "Lightweight aerated block with good insulating value.",
  },
  // ---- Roofs ----
  {
    id: "thatch",
    name: "Thatch",
    category: "roof",
    conductivityWPerMK: 0.07,
    thicknessMm: 200,
    costPerM2INR: 500,
    notes: "Low cost and insulating; needs regular upkeep and fire care.",
  },
  {
    id: "corrugated-metal",
    name: "Corrugated metal sheet",
    category: "roof",
    conductivityWPerMK: 50,
    thicknessMm: 1,
    costPerM2INR: 650,
    notes: "Quick to install; almost no insulation by itself.",
  },
  {
    id: "rcc",
    name: "RCC slab",
    category: "roof",
    conductivityWPerMK: 1.6,
    thicknessMm: 125,
    costPerM2INR: 2200,
    notes: "Strong and long-lasting; heats up in sun without insulation.",
  },
  {
    id: "timber-earth",
    name: "Timber + earth roof",
    category: "roof",
    conductivityWPerMK: 0.5,
    thicknessMm: 150,
    costPerM2INR: 1500,
    notes: "Traditional Himalayan build-up of timber joists with packed earth.",
  },
  // ---- Insulation ----
  {
    id: "none",
    name: "No insulation",
    category: "insulation",
    conductivityWPerMK: 0,
    costPerM2PerCm: 0,
    notes: "No added insulation layer.",
  },
  {
    id: "eps",
    name: "EPS board",
    category: "insulation",
    conductivityWPerMK: 0.036,
    costPerM2PerCm: 45,
    notes: "Expanded polystyrene; light and effective, needs fire protection.",
  },
  {
    id: "mineral-wool",
    name: "Mineral wool",
    category: "insulation",
    conductivityWPerMK: 0.04,
    costPerM2PerCm: 55,
    notes: "Non-combustible batts; keep dry.",
  },
  {
    id: "straw-bale",
    name: "Straw bale / straw board",
    category: "insulation",
    conductivityWPerMK: 0.06,
    costPerM2PerCm: 15,
    notes: "Agricultural by-product; low cost, must be kept dry.",
  },
]

export function getMaterial(id: string): Material {
  const material = MATERIALS.find((m) => m.id === id)
  if (!material) throw new Error(`Unknown material id: ${id}`)
  return material
}

export function materialsByCategory(category: MaterialCategory): Material[] {
  return MATERIALS.filter((m) => m.category === category)
}

export function materialName(id: string): string {
  return MATERIALS.find((m) => m.id === id)?.name ?? id
}
