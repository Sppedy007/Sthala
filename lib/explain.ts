import type {
  BestRecommendation,
  DesignAnalysis,
  DesignImprovement,
  GemmaExplanation,
  RecommendationAlternative,
  ShelterInput,
} from "./types"

// ---- Validation helpers ----

function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim() !== ""
}

function isStringArray(v: unknown): v is string[] {
  return Array.isArray(v) && v.every((x) => typeof x === "string")
}

function validateDesignImprovement(obj: unknown): obj is DesignImprovement {
  if (!obj || typeof obj !== "object") return false
  const o = obj as Record<string, unknown>
  return isNonEmptyString(o.suggestion) && typeof o.quantifiedImpact === "string"
}

function validateDesignAnalysis(obj: unknown): obj is DesignAnalysis {
  if (!obj || typeof obj !== "object") return false
  const o = obj as Record<string, unknown>
  return (
    isNonEmptyString(o.designName) &&
    isStringArray(o.advantages) &&
    isStringArray(o.limitations) &&
    Array.isArray(o.improvements) &&
    o.improvements.every(validateDesignImprovement)
  )
}

function validateAlternative(obj: unknown): obj is RecommendationAlternative {
  if (!obj || typeof obj !== "object") return false
  const o = obj as Record<string, unknown>
  return isNonEmptyString(o.designName) && isNonEmptyString(o.summary)
}

function validateBestRecommendation(obj: unknown): obj is BestRecommendation {
  if (!obj || typeof obj !== "object") return false
  const o = obj as Record<string, unknown>
  return (
    isNonEmptyString(o.recommendedDesign) &&
    isNonEmptyString(o.rationale) &&
    isStringArray(o.constraintsSatisfied) &&
    isStringArray(o.tradeoffs) &&
    Array.isArray(o.alternatives) &&
    o.alternatives.every(validateAlternative)
  )
}

export function validateGemmaExplanation(
  obj: unknown,
): { valid: true; data: GemmaExplanation } | { valid: false; error: string } {
  if (!obj || typeof obj !== "object") {
    return { valid: false, error: "Response is not a valid JSON object" }
  }
  const r = obj as Record<string, unknown>

  if (!isNonEmptyString(r.summary)) {
    return { valid: false, error: "summary must be a non-empty string" }
  }

  if (!Array.isArray(r.designAnalyses) || r.designAnalyses.length === 0) {
    return { valid: false, error: "designAnalyses must be a non-empty array" }
  }
  for (let i = 0; i < r.designAnalyses.length; i++) {
    if (!validateDesignAnalysis(r.designAnalyses[i])) {
      return {
        valid: false,
        error: `designAnalyses[${i}] is invalid — expected { designName, advantages[], limitations[], improvements[] }`,
      }
    }
  }

  if (!validateBestRecommendation(r.bestRecommendation)) {
    return {
      valid: false,
      error:
        "bestRecommendation is invalid — expected { recommendedDesign, rationale, constraintsSatisfied[], tradeoffs[], alternatives[] }",
    }
  }

  if (!isStringArray(r.caveats)) {
    return { valid: false, error: "caveats must be an array of strings" }
  }

  return {
    valid: true,
    data: {
      summary: r.summary,
      designAnalyses: r.designAnalyses as DesignAnalysis[],
      bestRecommendation: r.bestRecommendation as BestRecommendation,
      caveats: r.caveats,
    },
  }
}

export type ExplainResult =
  | { ok: true; data: GemmaExplanation }
  | { ok: false; error: string }

/**
 * Client function that POSTs to /api/explain with an AbortController
 * and returns the validated explanation or a typed error.
 */
export async function explainShelter(
  input: ShelterInput,
  options?: { signal?: AbortSignal },
): Promise<ExplainResult> {
  const signal = options?.signal

  try {
    const res = await fetch("/api/explain", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
      signal,
    })

    if (!res.ok) {
      let errMsg = `Server returned ${res.status}`
      try {
        const json = await res.json()
        if (json && typeof json.error === "string") {
          errMsg = json.error
        }
      } catch {
        // keep fallback status message
      }
      return { ok: false, error: errMsg }
    }

    const json = await res.json()
    const validated = validateGemmaExplanation(json)
    if (!validated.valid) {
      return { ok: false, error: `Invalid explanation format: ${validated.error}` }
    }
    return { ok: true, data: validated.data }
  } catch (err: unknown) {
    if (err instanceof DOMException && err.name === "AbortError") {
      return { ok: false, error: "Explanation request was aborted." }
    }
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to fetch AI explanation from server.",
    }
  }
}
