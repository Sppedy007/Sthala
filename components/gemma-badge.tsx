"use client"

import { Sparkles } from "lucide-react"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

export function GemmaBadge() {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <button
            type="button"
            className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 text-xs font-medium text-white/80"
          />
        }
      >
        <Sparkles className="size-3.5 text-violet-300" aria-hidden="true" />
          Powered by Gemini
          <span className="sr-only">: Gemma explains the calculated results; it does not do the calculations.</span>
      </TooltipTrigger>
      <TooltipContent>Gemma explains the calculated results; it does not do the calculations.</TooltipContent>
    </Tooltip>
  )
}
