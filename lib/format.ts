// Small helpers so every number on screen carries a unit.

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
})
const whole = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 })

export const formatINR = (value: number) => inr.format(Math.round(value))
export const formatW = (value: number) => `${whole.format(value)} W`
export const formatU = (value: number) => `${value.toFixed(2)} W/m²K`
export const formatK = (value: number) => `${value} W/mK`
export const formatM2 = (value: number) => `${value.toFixed(1)} m²`
export const formatMm = (value: number) => `${whole.format(value)} mm`
export const formatC = (value: number) => `${value} °C`
export const formatPct = (value: number) => `${Math.round(value)}%`

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

/** Formats "2026-10-21" as "21 Oct 2026" without relying on the browser locale. */
export function formatDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-").map(Number)
  return `${day} ${MONTHS[month - 1]} ${year}`
}
