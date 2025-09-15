import type { NextRequest } from "next/server"

export async function POST(request: NextRequest) {
  console.log("=== BACKGROUNDS GENERATE API CALLED ===")
  console.log("🌍 Environment info:", {
    nodeEnv: process.env.NODE_ENV,
    vercelEnv: process.env.VERCEL_ENV,
    headers: Object.fromEntries(request.headers.entries()),
  })

  try {
    const { teamName, count = 3 } = await request.json()

    console.log(
      "🏆 Generating backgrounds for team:",
      teamName,
      "count:",
      count
    )

    if (!teamName) {
      return Response.json(
        { success: false, error: "Team name is required" },
        { status: 400 }
      )
    }

    // Fire-and-forget: Trigger generation without waiting for response
    const requestBody = {
      team_name: teamName,
      size: "1024x1536",
      quality: "low",
      count: count,
    }
    console.log(
      "📤 Request body para render.com:",
      JSON.stringify(requestBody, null, 2)
    )
    console.log("🚀 Triggering background generation (fire-and-forget)...")
    console.log(
      "🌐 URL sendo chamada: https://letter-image.onrender.com/generate-team-backgrounds"
    )

    // Start generation but don't wait for it to complete
    fetch("https://letter-image.onrender.com/generate-team-backgrounds", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "User-Agent": "players-image-app/1.0",
      },
      body: JSON.stringify(requestBody),
    }).catch((error) => {
      console.error("❌ Background generation failed (async):", error)
    })

    // Return immediately without waiting
    return Response.json({
      success: true,
      message: `Background generation triggered for ${teamName} with count=${count}`,
      team_name: teamName,
      triggered: true,
    })
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
