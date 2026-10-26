import type { Climate, FormState, ShelterInput } from "./types"

// Illustrative design-day temperatures (not live weather).
export const CLIMATE_DEFAULTS: Record<Climate, { outdoorTempC: number; targetIndoorTempC: number; label: string }> = {
  Leh: { outdoorTempC: -15, targetIndoorTempC: 20, label: "Leh (cold desert)" },
  Delhi: { outdoorTempC: 44, targetIndoorTempC: 26, label: "Delhi (peak summer)" },
  Jaisalmer: { outdoorTempC: 47, targetIndoorTempC: 26, label: "Jaisalmer (hot desert)" },
}

export const CLIMATES = Object.keys(CLIMATE_DEFAULTS) as Climate[]

export const DEFAULT_FORM: FormState = {
  climate: "Leh",
  outdoorTempC: "-15",
  targetIndoorTempC: "20",
  lengthM: "5",
  widthM: "4",
  heightM: "2.7",
  occupants: "4",
  budgetINR: "150000",
  wallMaterialId: "fired-brick",
  roofMaterialId: "rcc",
  insulationMaterialId: "eps",
  insulationThicknessMm: 50,
  openingAreaM2: "3",
}

export type Scenario = { id: string; label: string; description: string; form: FormState }

export const SCENARIOS: Scenario[] = [
  {
    id: "cold-leh",
    label: "Extreme Cold — Leh",
    description: "Mud walls, timber-earth roof, mineral wool.",
    form: {
      climate: "Leh",
      outdoorTempC: "-15",
      targetIndoorTempC: "20",
      lengthM: "5",
      widthM: "4",
      heightM: "2.5",
      occupants: "4",
      budgetINR: "200000",
      wallMaterialId: "adobe",
      roofMaterialId: "timber-earth",
      insulationMaterialId: "mineral-wool",
      insulationThicknessMm: 100,
      openingAreaM2: "2",
    },
  },
  {
    id: "heat-jaisalmer",
    label: "Extreme Heat — Jaisalmer",
    description: "Stone walls, RCC roof, EPS board.",
    form: {
      climate: "Jaisalmer",
      outdoorTempC: "47",
      targetIndoorTempC: "26",
      lengthM: "6",
      widthM: "4",
      heightM: "3",
      occupants: "5",
      budgetINR: "180000",
      wallMaterialId: "stone",
      roofMaterialId: "rcc",
      insulationMaterialId: "eps",
      insulationThicknessMm: 50,
      openingAreaM2: "2.5",
    },
  },
  {
    id: "budget",
    label: "Budget-Constrained Shelter",
    description: "Small brick room, metal roof, tight budget.",
    form: {
      climate: "Delhi",
      outdoorTempC: "44",
      targetIndoorTempC: "26",
      lengthM: "4",
      widthM: "3",
      heightM: "2.7",
      occupants: "3",
      budgetINR: "60000",
      wallMaterialId: "fired-brick",
      roofMaterialId: "corrugated-metal",
      insulationMaterialId: "none",
      insulationThicknessMm: 0,
      openingAreaM2: "2",
    },
  },
]

/** Convert a validated input back into editable form values (used by History). */
export function inputToForm(input: ShelterInput): FormState {
  return {
    climate: input.climate,
    outdoorTempC: String(input.outdoorTempC),
    targetIndoorTempC: String(input.targetIndoorTempC),
    lengthM: String(input.lengthM),
    widthM: String(input.widthM),
    heightM: String(input.heightM),
    occupants: String(input.occupants),
    budgetINR: String(input.budgetINR),
    wallMaterialId: input.wallMaterialId,
    roofMaterialId: input.roofMaterialId,
    insulationMaterialId: input.insulationMaterialId,
    insulationThicknessMm: input.insulationThicknessMm,
    openingAreaM2: String(input.openingAreaM2),
  }
}

type NumericField = Exclude<
  keyof FormState,
  "climate" | "wallMaterialId" | "roofMaterialId" | "insulationMaterialId" | "insulationThicknessMm"
>

type Rule = { label: string; min: number; max: number; integer?: boolean; unit: string }

export const FIELD_RULES: Record<NumericField, Rule> = {
  outdoorTempC: { label: "Outdoor temperature", min: -50, max: 60, unit: "°C" },
  targetIndoorTempC: { label: "Target indoor temperature", min: 10, max: 35, unit: "°C" },
  lengthM: { label: "Length", min: 1, max: 30, unit: "m" },
  widthM: { label: "Width", min: 1, max: 30, unit: "m" },
  heightM: { label: "Height", min: 1.8, max: 6, unit: "m" },
  occupants: { label: "Occupants", min: 1, max: 12, integer: true, unit: "people" },
  budgetINR: { label: "Budget", min: 1000, max: 10000000, unit: "₹" },
  openingAreaM2: { label: "Opening area", min: 0, max: 200, unit: "m²" },
}

export type FormErrors = Partial<Record<NumericField, string>>

/** Check every numeric field and return a friendly message for each problem. */
export function validateForm(form: FormState): FormErrors {
  const errors: FormErrors = {}
  for (const key of Object.keys(FIELD_RULES) as NumericField[]) {
    const rule = FIELD_RULES[key]
    const raw = form[key].trim()
    const value = Number(raw)
    if (raw === "" || Number.isNaN(value)) {
      errors[key] = `${rule.label} is required.`
    } else if (rule.integer && !Number.isInteger(value)) {
      errors[key] = `${rule.label} must be a whole number.`
    } else if (value < rule.min || value > rule.max) {
      errors[key] = `Enter ${rule.min} to ${rule.max.toLocaleString("en-IN")} ${rule.unit}.`
    }
  }
  // Openings cannot be larger than the walls they sit in.
  if (!errors.openingAreaM2 && !errors.lengthM && !errors.widthM && !errors.heightM) {
    const gross = 2 * (Number(form.lengthM) + Number(form.widthM)) * Number(form.heightM)
    if (Number(form.openingAreaM2) >= gross) {
      errors.openingAreaM2 = `Opening area must be smaller than the wall area (${gross.toFixed(1)} m²).`
    }
  }
  return errors
}

export function formToInput(form: FormState): ShelterInput {
  return {
    climate: form.climate,
    outdoorTempC: Number(form.outdoorTempC),
    targetIndoorTempC: Number(form.targetIndoorTempC),
    lengthM: Number(form.lengthM),
    widthM: Number(form.widthM),
    heightM: Number(form.heightM),
    occupants: Number(form.occupants),
    budgetINR: Number(form.budgetINR),
    wallMaterialId: form.wallMaterialId,
    roofMaterialId: form.roofMaterialId,
    insulationMaterialId: form.insulationMaterialId,
    insulationThicknessMm: form.insulationThicknessMm,
    openingAreaM2: Number(form.openingAreaM2),
  }
}
