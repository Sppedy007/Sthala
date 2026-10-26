// Script to test POST /api/explain with a cold-scenario ShelterInput
const coldScenarioInput = {
  climate: "Leh",
  outdoorTempC: -15,
  targetIndoorTempC: 20,
  lengthM: 5,
  widthM: 4,
  heightM: 2.5,
  occupants: 4,
  budgetINR: 200000,
  wallMaterialId: "adobe",
  roofMaterialId: "timber-earth",
  insulationMaterialId: "mineral-wool",
  insulationThicknessMm: 100,
  openingAreaM2: 2,
}

const targetUrl = process.env.TEST_URL || "http://localhost:3000/api/explain"

async function main() {
  console.log(`Sending cold-scenario payload to ${targetUrl}...`)
  try {
    const res = await fetch(targetUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(coldScenarioInput),
    })

    console.log(`HTTP Status: ${res.status} ${res.statusText}`)
    const rawText = await res.text()
    console.log("\nRAW JSON response:")
    console.log(rawText)
  } catch (err) {
    console.error("Fetch failed:", err)
    process.exit(1)
  }
}

main()
