import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

import { generateImage } from "@/lib/aiml"

export async function POST(request: NextRequest) {
  console.log("=== CHAT IMAGE GENERATE API CALLED ===")
  try {
    const { playerImageUrl, backgroundImageUrl, userName } = await request.json()

    if (!playerImageUrl || !backgroundImageUrl) {
      return NextResponse.json(
        { error: "Both images are required" },
        { status: 400 }
      )
    }

    console.log("Generating image for user:", userName)
    console.log("Player image:", playerImageUrl)
    console.log("Background image:", backgroundImageUrl)

    // Fixed prompt for mixing player with background
    const prompt = "mix player_photo with background_photo"
    const imageUrls = [playerImageUrl, backgroundImageUrl]

    // Generate image using AIML API
    const imageBase64 = await generateImage(prompt, imageUrls)

    console.log("Image generated successfully for:", userName)

    return NextResponse.json({
      success: true,
      imageBase64,
      userName,
    })
  } catch (error) {
    console.error("Error in chat image generation:", error)
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : "Failed to generate image"
      },
      { status: 500 }
    )
  }
}