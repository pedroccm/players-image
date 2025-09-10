import type { NextRequest } from "next/server"

export async function POST(request: NextRequest) {
  console.log("=== BACKGROUNDS GENERATE API CALLED ===")
  console.log("🌍 Environment info:", {
    nodeEnv: process.env.NODE_ENV,
    vercelEnv: process.env.VERCEL_ENV,
    headers: Object.fromEntries(request.headers.entries()),
  })

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
      
      const requestBody = {
        team_name: teamName,
        size: "1024x1536",
        quality: "low",
        count: 1,
      }
      console.log("📤 Request body:", requestBody)

      const response = await fetch(
        "https://letter-image.onrender.com/generate-team-backgrounds",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            "User-Agent": "players-image-app/1.0",
          },
          body: JSON.stringify(requestBody),
          signal: AbortSignal.timeout(30000), // 30 second timeout
        }
      )

      console.log("🌐 API response status:", response.status)
      console.log("🌐 API response headers:", Object.fromEntries(response.headers.entries()))

      if (!response.ok) {
        const errorText = await response.text()
        console.error("❌ External API error response:", errorText)
        
        // Parse error response to provide better user feedback
        let errorMessage = `External API error: ${response.status}`
        try {
          const errorData = JSON.parse(errorText)
          if (errorData.detail) {
            errorMessage = `External API temporarily unavailable: ${errorData.detail}`
          }
        } catch {
          errorMessage += ` - ${errorText}`
        }
        
        throw new Error(errorMessage)
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
