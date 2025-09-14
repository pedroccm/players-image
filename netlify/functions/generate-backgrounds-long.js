// Background Function para processos longos (até 15min no Netlify Pro)
exports.handler = async (event) => {
  console.log("=== BACKGROUND FUNCTION STARTED ===")

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method not allowed" }),
    }
  }

  try {
    const { teamName, teamId } = JSON.parse(event.body || "{}")

    console.log(`🏆 Processing team: ${teamName} (ID: ${teamId})`)

    // Chamar a API interna com timeout longo
    const response = await fetch(
      `${process.env.URL}/api/backgrounds/generate-local`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Passar headers de autenticação se necessário
        },
        body: JSON.stringify({ teamName, teamId }),
        // Sem timeout - deixar a API interna gerenciar
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`API call failed: ${response.status} - ${errorText}`)
    }

    const result = await response.json()
    console.log("✅ Background processing completed:", result)

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
      },
      body: JSON.stringify(result),
    }
  } catch (error) {
    console.error("❌ Background function error:", error)

    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
      },
      body: JSON.stringify({
        success: false,
        error: error.message || "Background processing failed",
      }),
    }
  }
}
