import type { NextRequest } from "next/server"

export async function POST(request: NextRequest) {
  console.log("=== BACKGROUNDS GENERATE API CALLED ===")

  try {
    const { teamName } = await request.json()

    console.log("🏆 Generating backgrounds for team:", teamName)

    if (!teamName) {
      return Response.json(
        { success: false, error: "Team name is required" },
        { status: 400 }
      )
    }

    // Make only 1 API call to avoid timeout, frontend will call multiple times
    try {
      console.log("🌐 Making single API call...")

      const response = await fetch(
        "https://letter-image.onrender.com/generate-team-backgrounds",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            team_name: teamName,
            size: "1024x1536",
            quality: "low",
            count: 1,
          }),
        }
      )

      console.log("🌐 API response status:", response.status)

      if (!response.ok) {
        throw new Error(`External API error: ${response.status}`)
      }

      const data = await response.json()
      console.log("📊 API data:", data)

      if (data.urls && Array.isArray(data.urls)) {
        return Response.json({
          success: true,
          count: data.urls.length,
          team_name: teamName,
          urls: data.urls,
        })
      } else {
        throw new Error("Invalid response format from external API")
      }
    } catch (error) {
      console.error("❌ API call error:", error)
      throw error
    }
  } catch (error) {
    console.error("❌ Error generating backgrounds:", error)

    return Response.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate backgrounds",
      },
      { status: 500 }
    )
  }
}
