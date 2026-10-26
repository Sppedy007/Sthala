import { AIR_CHANGES_PER_HOUR, INSIDE_FILM_R, OPENING_U, OUTSIDE_FILM_R } from "@/lib/calc"

export function Footer({ maxWidth = "max-w-7xl" }: { maxWidth?: string }) {
  return (
    <footer className="border-t border-white/10 bg-ink/40">
      <div className={`mx-auto flex ${maxWidth} flex-col gap-2 px-5 py-6 text-xs leading-relaxed text-white/65`}>
        <p>
          Indicative steady-state model: inside surface film R = {INSIDE_FILM_R} m²K/W, outside film R = {OUTSIDE_FILM_R} m²K/W, openings U = {OPENING_U} W/m²K, and {AIR_CHANGES_PER_HOUR} air changes per hour. Ground/floor heat transfer is excluded, and solar gain is not modeled.
        </p>
        <p className="text-white/45">
          Estimates only for preliminary comparison. Not certified engineering advice.
        </p>
      </div>
    </footer>
  )
}
