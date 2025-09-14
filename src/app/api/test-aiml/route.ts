export async function GET() {
  try {
    console.log("🧪 Testing AIML API...")
    console.log("API Key exists:", !!process.env.AIML_API_KEY)
    console.log(
      "API Key first chars:",
      process.env.AIML_API_KEY?.substring(0, 8)
    )

    const response = await fetch(
      "https://api.aimlapi.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.AIML_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4",
          messages: [
            {
              role: "user",
              content: "Hello",
            },
          ],
        }),
      }
    )

    console.log("AIML Response status:", response.status)
    console.log("AIML Response ok:", response.ok)

    if (!response.ok) {
      const errorText = await response.text()
      console.error("AIML API Error:", errorText)
      return Response.json({
        success: false,
        error: `AIML API returned ${response.status}: ${errorText}`,
        status: response.status,
      })
    }

    const data = await response.json()
    console.log("✅ AIML API Success!")

    return Response.json({
      success: true,
      message: "AIML API is working!",
      aimlResponse:
        data.choices?.[0]?.message?.content || "No response content",
      status: response.status,
    })
  } catch (error) {
    console.error("❌ Test AIML Error:", error)
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}