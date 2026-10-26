// Simple, steady-state heat-transfer maths for a box-shaped shelter.
// Every function here is "pure": same inputs → same outputs, no side effects.
// This is an indicative model, NOT a certified engineering calculation.

import { getMaterial } from "./materials"
import type { DesignName, Geometry, MaterialLine, ShelterInput } from "./types"

// ---- Fixed assumptions (all illustrative) ----
/** Thermal resistance of the still air film on the inside surface (m²K/W). */
export const INSIDE_FILM_R = 0.13
/** Thermal resistance of the air film on the outside surface (m²K/W). */
export const OUTSIDE_FILM_R = 0.04
/** Assumed U-value of windows/doors: single glazing (W/m²K). */
export const OPENING_U = 2.8
/** Assumed air changes per hour (how often the indoor air is replaced). */
export const AIR_CHANGES_PER_HOUR = 0.5
/** Heat capacity of air expressed per m³ per hour per °C (W·h/m³K). */
export const AIR_HEAT_FACTOR = 0.33

/** Work out wall, roof and floor areas plus the volume of the room. */
export function computeGeometry(input: ShelterInput): Geometry {
  const { lengthM: L, widthM: W, heightM: H, openingAreaM2 } = input
  const grossWallAreaM2 = 2 * (L + W) * H
  // Openings (doors/windows) replace part of the wall, so subtract them.
  const wallAreaM2 = Math.max(0, grossWallAreaM2 - openingAreaM2)
  const roofAreaM2 = L * W
  return {
    grossWallAreaM2,
    wallAreaM2,
    roofAreaM2,
    floorAreaM2: L * W,
    volumeM3: L * W * H,
    openingAreaM2,
    deltaTC: temperatureDifference(input.targetIndoorTempC, input.outdoorTempC),
  }
}

/** ΔT = |indoor target − outdoor|, in °C. */
export function temperatureDifference(targetC: number, outdoorC: number): number {
  return Math.abs(targetC - outdoorC)
}

/** Heat flows out when it is colder outside, and in when it is hotter outside. */
export function heatDirection(targetC: number, outdoorC: number): "loss" | "gain" {
  return outdoorC > targetC ? "gain" : "loss"
}

/** Resistance of one layer: R = thickness (m) / conductivity k (W/mK). */
export function layerResistance(thicknessMm: number, conductivity: number): number {
  if (thicknessMm <= 0 || conductivity <= 0) return 0
  return thicknessMm / 1000 / conductivity
}

/**
 * U-value of a build-up of layers.
 * R_total = inside film + Σ layer resistances + outside film, and U = 1 / R_total.
 * Lower U means less heat gets through each m² for each °C of difference.
 */
export function uValue(layers: { thicknessMm: number; conductivity: number }[]): number {
  const layersR = layers.reduce((sum, l) => sum + layerResistance(l.thicknessMm, l.conductivity), 0)
  return 1 / (INSIDE_FILM_R + layersR + OUTSIDE_FILM_R)
}

/** Q_fabric = (U_wall·A_wall + U_roof·A_roof + U_open·A_open) · ΔT, in watts. */
export function fabricHeat(
  parts: { u: number; areaM2: number }[],
  deltaTC: number,
): number {
  return parts.reduce((sum, p) => sum + p.u * p.areaM2, 0) * deltaTC
}

/** Q_vent = 0.33 · ACH · Volume · ΔT, in watts (air leaking in and out). */
export function ventilationHeat(volumeM3: number, deltaTC: number): number {
  return AIR_HEAT_FACTOR * AIR_CHANGES_PER_HOUR * volumeM3 * deltaTC
}

export type DesignSpec = {
  name: DesignName
  wallMaterialId: string
  roofMaterialId: string
  insulationMaterialId: string
  insulationThicknessMm: number
}

/** Run the full thermal + cost estimate for one design option. */
export function evaluateDesign(spec: DesignSpec, geometry: Geometry, input: ShelterInput) {
  const wall = getMaterial(spec.wallMaterialId)
  const roof = getMaterial(spec.roofMaterialId)
  const insulation = getMaterial(spec.insulationMaterialId)
  // "No insulation" always means a 0 mm layer.
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

  // Cost = area × illustrative rate. Insulation is priced per cm of thickness
  // and covers both wall and roof area.
  const wallCost = geometry.wallAreaM2 * (wall.costPerM2INR ?? 0)
  const roofCost = geometry.roofAreaM2 * (roof.costPerM2INR ?? 0)
  const insulatedArea = geometry.wallAreaM2 + geometry.roofAreaM2
  const insulationCost = insulatedArea * (insulationMm / 10) * (insulation.costPerM2PerCm ?? 0)
  const estimatedCostINR = wallCost + roofCost + insulationCost

  const share = (cost: number) => (estimatedCostINR > 0 ? (cost / estimatedCostINR) * 100 : 0)
  const breakdown: MaterialLine[] = [
    {
      role: "Wall",
      materialId: wall.id,
      materialName: wall.name,
      thicknessMm: wall.thicknessMm ?? 0,
      areaM2: geometry.wallAreaM2,
      conductivityWPerMK: wall.conductivityWPerMK,
      costINR: wallCost,
      costSharePct: share(wallCost),
    },
    {
      role: "Roof",
      materialId: roof.id,
      materialName: roof.name,
      thicknessMm: roof.thicknessMm ?? 0,
      areaM2: geometry.roofAreaM2,
      conductivityWPerMK: roof.conductivityWPerMK,
      costINR: roofCost,
      costSharePct: share(roofCost),
    },
    {
      role: "Insulation",
      materialId: insulation.id,
      materialName: insulation.name,
      thicknessMm: insulationMm,
      areaM2: insulationMm > 0 ? insulatedArea : 0,
      conductivityWPerMK: insulation.conductivityWPerMK,
      costINR: insulationCost,
      costSharePct: share(insulationCost),
    },
  ]

  return {
    ...spec,
    insulationThicknessMm: insulationMm,
    uWall,
    uRoof,
    uOpening: OPENING_U,
    fabricHeatW,
    ventilationHeatW,
    heatTransferW,
    heatPerFloorM2: geometry.floorAreaM2 > 0 ? heatTransferW / geometry.floorAreaM2 : 0,
    heatDirection: heatDirection(input.targetIndoorTempC, input.outdoorTempC),
    estimatedCostINR,
    breakdown,
  }
}
