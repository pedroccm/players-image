import { NextResponse } from "next/server"

import type { NextRequest } from "next/server"

import { generateImage } from "@/lib/aiml"

export async function POST(request: NextRequest) {
  console.log("=== CHAT IMAGE GENERATE API CALLED ===")
  try {
    const {
      playerImageUrl,
      backgroundImageUrl,
      userName,
      gameLocation,
      gameDateTime,
      hasPremium,
    } = await request.json()

    if (!playerImageUrl || !backgroundImageUrl) {
      return NextResponse.json(
        { error: "Both images are required" },
        { status: 400 }
      )
    }

    console.log("Generating image for user:", userName)
    console.log("Player image:", playerImageUrl)
    console.log("Background image:", backgroundImageUrl)
    console.log("🔍 API received gameLocation:", gameLocation)
    console.log("🔍 API received gameDateTime:", gameDateTime)
    console.log("💎 API received hasPremium:", hasPremium)

    // Fixed prompt for mixing player with background
    const prompt = "mix player_photo with background_photo"
    const imageUrls = [playerImageUrl, backgroundImageUrl]

    // Generate image using AIML API
    const imageBase64 = await generateImage(
      prompt,
      imageUrls,
      userName,
      gameLocation,
      gameDateTime,
      hasPremium
    )

    console.log("Image generated successfully for:", userName)

    return NextResponse.json({
      success: true,
      imageBase64,
      userName,
    })
  } catch (error) {
    console.error("Error in chat image generation:", error)

    // Check if it's a 422 content policy error
    if (error instanceof Error && error.message.includes("422")) {
      console.log("🚫 Content policy violation detected")
      return NextResponse.json({
        success: false,
        error: "content_blocked",
        message:
          "Essa foto não pôde ser processada devido às políticas de conteúdo. Por favor, envie outra foto.",
      })
    }

    // Other errors
    return NextResponse.json(
      {
        success: false,
        error: "generation_failed",
        message:
          error instanceof Error ? error.message : "Failed to generate image",
      },
      { status: 500 }
    )
  }
}
