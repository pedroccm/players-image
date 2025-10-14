import { NextResponse } from "next/server"

import type { NextRequest } from "next/server"

import { generateImageWithTextImages } from "@/lib/aiml"

export async function POST(request: NextRequest) {
  console.log("=== CHAT IMAGE GENERATE API CALLED ===")
  try {
    const {
      playerImageUrl,
      backgroundImageUrl,
      customPrompt,
      userName,
      gameLocation,
      gameDateTime,
      homeTeam,
      awayTeam,
      generateBothVersions,
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
    console.log("📝 Custom prompt:", customPrompt)
    console.log("🔍 API received gameLocation:", gameLocation)
    console.log("🔍 API received gameDateTime:", {
      value: gameDateTime,
      type: typeof gameDateTime,
      hasValue: !!gameDateTime,
      length: gameDateTime?.length,
      trimmed: gameDateTime?.trim?.(),
    })
    console.log("🎨 API received generateBothVersions:", generateBothVersions)

    // Use custom prompt from user or default
    const prompt =
      customPrompt ||
      "Combine the two images by cutting out the player photo (completely removing its background) and placing it on top of the background image, without blending, keeping the player sharp and clearly in the foreground."
    const imageUrls = [playerImageUrl, backgroundImageUrl]

    console.log("🚀 About to call generateImageWithTextImages...")
    console.log("📝 Final prompt:", prompt)
    console.log("🖼️ Image URLs count:", imageUrls.length)

    // Generate image using AIML API
    const result = await generateImageWithTextImages(
      prompt,
      imageUrls,
      userName,
      gameLocation,
      gameDateTime,
      homeTeam,
      awayTeam,
      generateBothVersions
    )

    console.log("✅ generateImageWithTextImages completed successfully")

    console.log("Image generated successfully for:", userName)

    return NextResponse.json({
      success: true,
      imageBase64: result.finalImage,
      premiumImageBase64: result.premiumImage,
      locationImage: result.locationImage,
      datetimeImage: result.datetimeImage,
      userName,
    })
  } catch (error) {
    console.error("❌ Error in chat image generation:", error)
    console.error("❌ Error type:", typeof error)
    console.error(
      "❌ Error name:",
      error instanceof Error ? error.name : "Unknown"
    )
    console.error(
      "❌ Error message:",
      error instanceof Error ? error.message : String(error)
    )
    console.error(
      "❌ Error stack:",
      error instanceof Error ? error.stack : "No stack trace"
    )

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
