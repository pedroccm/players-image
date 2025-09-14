import { Handler } from "@netlify/functions"

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method not allowed" }),
    }
  }

  try {
    const { teamName, teamId } = JSON.parse(event.body || "{}")

    // Processar em background function (até 15min no Netlify Pro)
    const response = await fetch(
      `${process.env.URL}/api/backgrounds/generate-local`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamName, teamId }),
      }
    )

    const result = await response.json()

    return {
      statusCode: 200,
      body: JSON.stringify(result),
    }
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
    }
  }
}
