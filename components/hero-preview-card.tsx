"use client"

import { motion } from "framer-motion"
import { IllustrativeBadge } from "@/components/data-badge"
import { formatINR, formatW } from "@/lib/format"

export type PreviewRow = { name: string; heatW: number; costINR: number }

export function HeroPreviewCard({ rows }: { rows: PreviewRow[] }) {
  const maxHeat = Math.max(...rows.map((r) => r.heatW))
  return (
    <motion.div
      animate={{ y: [0, -8, 0] }}
      transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      className="glass w-full max-w-md justify-self-center p-6 lg:justify-self-end"
    >
      <div className="mb-5 flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-white/95">Sample comparison</h2>
        <IllustrativeBadge label="Illustrative data" />
      </div>
      <p className="mb-4 text-sm text-white/65">Leh, −15 °C outside, 20 °C target, 5 × 4 m room</p>
      <ul className="flex flex-col gap-4">
        {rows.map((row) => (
          <li key={row.name} className="flex flex-col gap-2">
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="font-medium text-white/95">{row.name}</span>
              <span className="text-white/65">
                <span className="text-white/95">{formatW(row.heatW)}</span> heat loss · {formatINR(row.costINR)}
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-white/[0.06]" aria-hidden="true">
              <div
                className="h-full rounded-full bg-white/40"
                style={{ width: `${Math.max(8, (row.heatW / maxHeat) * 100)}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </motion.div>
  )
}
