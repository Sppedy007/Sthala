import { GoogleGenAI } from "@google/genai"
import { readFileSync } from "fs"

try {
  const envContent = readFileSync(".env.local", "utf8")
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim()
    if (trimmed && !trimmed.startsWith("#")) {
      const idx = trimmed.indexOf("=")
      if (idx > 0) {
        process.env[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim()
      }
    }
  }
} catch {}

const apiKey = process.env.GEMINI_API_KEY
const ai = new GoogleGenAI({ apiKey })

try {
  const list = await ai.models.list()
  for await (const m of list) {
    if (m.name.includes("gemma") || m.name.includes("flash") || m.name.includes("gemini")) {
      console.log(m.name, m.supportedActions || "")
    }
  }
} catch (e) {
  console.error("List failed:", e.message)
}
