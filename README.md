# Sthala

Compare three shelter designs (Budget, Balanced, High Insulation) for extreme climates
before you build. Sthala estimates steady-state heat transfer and material cost with a
transparent calculation engine, then uses **Gemma 4** to explain the trade-offs in plain
language.

Built for the Hacktoberfest Hack Day Delhi x Skillop DTU hackathon (Best Use of Gemma 4).

## How it works

1. Pick a climate example (Leh, Delhi or Jaisalmer) or enter your own conditions, shelter
   size, occupants, budget and materials.
2. A deterministic TypeScript engine calculates U-values, heat transfer (W) and an
   estimated material cost for each of the three designs.
3. Gemma 4 receives the inputs and the calculated results, then explains the
   recommendation, trade-offs and possible improvements. It does not do the calculations
   and is instructed not to invent numbers or material properties.

If the Gemma call fails, the calculated results stay visible and the app shows a clear
error with a retry button.

## Calculation model

- Steady-state conduction through layered walls and roof: U = 1 / (Rsi + Rse + Σ t/k)
- Heat transfer Q = Σ(U·A)·ΔT, plus a simple ventilation term
- Doors and windows are modelled as an opening area with an assumed U-value
- Floor is excluded

All assumptions are listed in the app and in `lib/calc.ts`.

## Limitations

- These are indicative estimates, not certified engineering calculations.
- The model excludes solar gain, thermal mass, wind and moisture.
- Material conductivities, prices and design-day temperatures are illustrative placeholders.
  Verify them locally before relying on any result.

## Tech stack

Next.js, React, TypeScript, Tailwind CSS, Gemma 4 via the Gemini API (`@google/genai`).

## Run locally

```bash
npm install
```

Create `.env.local` in the project root:

```
GEMINI_API_KEY=your_key_here
GEMMA_MODEL=gemma-4-26b-a4b-it
```

```bash
npm run dev
```

Open http://localhost:3000. The API key is only read server-side in
`app/api/explain/route.ts` and is never sent to the browser.

## Project structure

- `lib/calc.ts`, `lib/materials.ts`: calculation engine and material data
- `lib/analyze.ts`: builds the three designs and the recommendation
- `app/api/explain/route.ts`: server-side Gemma integration
- `components/`: interface

## License

Add a license of your choice before publishing.