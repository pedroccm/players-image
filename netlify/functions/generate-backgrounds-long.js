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

    // Processar diretamente sem chamar API interna (evita timeout duplo)
    console.log(`🚀 Processing directly in Background Function...`)

    // Simular processamento (substituir por lógica real da AIML)
    await new Promise(resolve => setTimeout(resolve, 2000)) // 2s de simulação

    const result = {
      success: true,
      team_name: teamName,
      urls: [
        `https://via.placeholder.com/800x600?text=${teamName}-bg-1`,
        `https://via.placeholder.com/800x600?text=${teamName}-bg-2`,
        `https://via.placeholder.com/800x600?text=${teamName}-bg-3`
      ]
    }
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
