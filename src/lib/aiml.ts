import path from "path"

import { OpenAI } from "openai"
import sharp from "sharp"

import {
  generateGameDateTimeImage,
  generateGameLocationImage,
} from "./text-to-image"

// Note: Agharti font is now handled by Letter-Image API

const AIML_API_KEY = process.env.AIML_API_KEY

if (!AIML_API_KEY) {
  throw new Error("AIML_API_KEY is not defined in environment variables")
}

export const aimlClient = new OpenAI({
  baseURL: "https://api.aimlapi.com/v1",
  apiKey: AIML_API_KEY,
})

export interface ImageGenerationRequest {
  model: "google/gemini-2.5-flash-image-edit"
  prompt: string
  image_urls: string[]
  num_images?: number
}

export interface ImageGenerationResponse {
  status: string
  prompt: string[]
  model: string
  model_owner: string
  tags: Record<string, unknown>
  num_returns: number
  args: {
    model: string
    prompt: string
    n: number
    steps: number
    size: string
  }
  subjobs: unknown[]
  output: {
    choices: Array<{
      image_base64: string
    }>
  }
}

async function applyLogosToImage(
  base64Image: string,
  userName?: string,
  gameLocation?: string,
  gameDateTime?: string,
  hasPremium: boolean = false
): Promise<string> {
  console.log("🎨 === STARTING OVERLAY APPLICATION ===")
  console.log("📊 Input parameters:", {
    userName,
    gameLocation,
    gameDateTime,
    imageLength: base64Image.length,
  })

  try {
    // Convert base64 to buffer
    const imageBuffer = Buffer.from(base64Image, "base64")

    // Load the main image
    const mainImage = sharp(imageBuffer)
    const { width, height } = await mainImage.metadata()

    console.log("📐 Main image dimensions:", { width, height })

    if (!width || !height) {
      throw new Error("Could not get image dimensions")
    }

    // Add [Image #1] overlay - escudos-shape.png at 50% size
    const escudosShapePath = path.join(
      process.cwd(),
      "public",
      "images",
      "escudos-shape.png"
    )

    // Get original dimensions of escudos-shape.png and resize to fixed width 500px
    const escudosMetadata = await sharp(escudosShapePath).metadata()
    const escudosWidth = 500 // Fixed width of 500px
    const aspectRatio =
      (escudosMetadata.height || 300) / (escudosMetadata.width || 500)
    const escudosHeight = Math.floor(escudosWidth * aspectRatio) // Proportional height

    console.log("🖼️ [Image #1] escudos-shape dimensions:", {
      original: `${escudosMetadata.width}x${escudosMetadata.height}`,
      resized: `${escudosWidth}x${escudosHeight}`,
      aspectRatio: aspectRatio,
    })

    const escudosShape = await sharp(escudosShapePath)
      .resize(escudosWidth, escudosHeight, {
        fit: "contain",
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png()
      .toBuffer()

    // Logo paths
    const portuguesaLogoPath = path.join(
      process.cwd(),
      "public",
      "images",
      "portuguesa.png"
    )
    const spfcLogoPath = path.join(
      process.cwd(),
      "public",
      "images",
      "spfc.png"
    )

    console.log("🏆 Loading logos:", {
      portuguesa: portuguesaLogoPath,
      spfc: spfcLogoPath,
    })

    // Calculate logo size (10% of image width)
    const logoSize = Math.floor(width * 0.1)
    console.log("📏 Logo size calculated:", logoSize, "px")

    // Resize logos
    const portuguesaLogo = await sharp(portuguesaLogoPath)
      .resize(logoSize, logoSize, {
        fit: "contain",
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png()
      .toBuffer()

    const spfcLogo = await sharp(spfcLogoPath)
      .resize(logoSize, logoSize, {
        fit: "contain",
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png()
      .toBuffer()

    console.log("✅ Logos processed successfully:", {
      portuguesaSize: portuguesaLogo.length,
      spfcSize: spfcLogo.length,
    })

    // Generate text overlays using Letter-Image API
    const textOverlays = []

    // Username text removed - only show game location

    // Add gameLocation text if provided
    console.log("🔍 Checking gameLocation:", {
      gameLocation,
      hasValue: !!gameLocation,
    })
    if (gameLocation) {
      console.log(
        "📍 Generating game location image via Letter-Image API:",
        gameLocation
      )
      const gameLocationImageData =
        await generateGameLocationImage(gameLocation)

      console.log("📍 Game location image generated:", {
        bufferSize: gameLocationImageData.imageBuffer.length,
        width: gameLocationImageData.width,
        height: gameLocationImageData.height,
      })

      // Resize to fit image width and position at bottom center (no username anymore)
      const resizedGameLocationImage = await sharp(
        gameLocationImageData.imageBuffer
      )
        .resize(width, 120, {
          // Increased height for 72px font
          fit: "contain",
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        })
        .png()
        .toBuffer()

      textOverlays.push({
        input: resizedGameLocationImage,
        top: 1065, // y: 1065 (5px up from 1070)
        left: -110, // x: -110 (20px left from -90)
      })

      console.log("📍 Game location text positioned at bottom")
      console.log("📍 textOverlays after adding location:", textOverlays.length)
    }

    // Add gameDateTime text if provided
    console.log("🔍 Checking gameDateTime:", {
      gameDateTime,
      hasValue: !!gameDateTime,
    })
    if (gameDateTime) {
      console.log(
        "🕒 Generating game date/time image via Letter-Image API:",
        gameDateTime
      )
      const gameDateTimeImageData =
        await generateGameDateTimeImage(gameDateTime)

      console.log("🕒 Game date/time image generated:", {
        bufferSize: gameDateTimeImageData.imageBuffer.length,
        width: gameDateTimeImageData.width,
        height: gameDateTimeImageData.height,
      })

      // Resize to fit image width and position below location text
      const resizedGameDateTimeImage = await sharp(
        gameDateTimeImageData.imageBuffer
      )
        .resize(width, 100, {
          // Smaller height for datetime
          fit: "contain",
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        })
        .png()
        .toBuffer()

      textOverlays.push({
        input: resizedGameDateTimeImage,
        top: 1180, // y: 1180 (below location text)
        left: -70, // x: -70 (same as location)
      })

      console.log("🕒 Game date/time text positioned below location")
      console.log("🕒 textOverlays after adding datetime:", textOverlays.length)
    } else {
      console.log("❌ gameDateTime not provided or empty")
    }

    // Apply logos and text overlays (no background image)
    const composite = [
      // [Image #1] escudos-shape at fixed 500px width
      {
        input: escudosShape,
        top: 1050, // y: 1050
        left: -15, // x: -15 (-5px)
      },
      // Logos
      {
        input: portuguesaLogo,
        top: 1055, // y: 1055 (5px down from 1050)
        left: 51, // x: 51 (-2px)
      },
      {
        input: spfcLogo,
        top: 1149, // y: 1149 (5px up from 1154)
        left: 51, // x: 51 (-2px)
      },
      // Text overlays
      ...textOverlays,
    ]

    console.log("🎯 Compositing final image with", composite.length, "overlays")
    console.log("🎯 Text overlays count:", textOverlays.length)
    console.log(
      "🎯 Composite array:",
      composite.map((c) => ({
        hasInput: !!c.input,
        top: c.top,
        left: c.left,
      }))
    )

    const result = await mainImage.composite(composite).png().toBuffer()

    console.log("✅ Base composition completed successfully!")

    // Add watermark if not premium
    let finalResult = result
    if (!hasPremium) {
      console.log("💧 Adding watermark for free version...")

      try {
        // Load watermark
        const watermarkPath = path.join(
          process.cwd(),
          "public",
          "images",
          "marcadagua.png"
        )

        console.log("🔍 Watermark path:", watermarkPath)

        // Check if watermark exists
        const { existsSync } = await import("fs")
        if (!existsSync(watermarkPath)) {
          throw new Error(`Watermark file not found at: ${watermarkPath}`)
        }

        console.log("✅ Watermark file found, applying...")

        // Resize watermark to match image dimensions (100% coverage)
        const watermarkBuffer = await sharp(watermarkPath)
          .resize(width, height, {
            fit: "fill",
          })
          .png()
          .toBuffer()

        // Apply watermark at top-left corner (0,0) over everything
        finalResult = await sharp(result)
          .composite([
            {
              input: watermarkBuffer,
              top: 0,
              left: 0,
            },
          ])
          .png()
          .toBuffer()

        console.log("💧 Watermark applied successfully!")
      } catch (watermarkError) {
        console.error("❌ Error applying watermark:", watermarkError)
        console.log("📦 Using image without watermark")
        finalResult = result // Use original if watermark fails
      }
    } else {
      console.log("💎 Premium user - no watermark applied")
    }

    console.log("📊 Final image size:", finalResult.length, "bytes")

    // Convert back to base64
    return finalResult.toString("base64")
  } catch (error) {
    console.error("❌ ERROR applying logos and text:", error)
    console.error(
      "❌ Error stack:",
      error instanceof Error ? error.stack : "No stack trace"
    )
    // Return original image if processing fails
    return base64Image
  }
}

export async function generateImage(
  prompt: string,
  imageUrls: string[],
  userName?: string,
  gameLocation?: string,
  gameDateTime?: string,
  hasPremium: boolean = false
): Promise<string> {
  console.log("🚀 === GENERATE IMAGE CALLED ===")
  console.log("📋 Parameters:", {
    userName,
    gameLocation,
    gameDateTime,
    imageCount: imageUrls.length,
  })
  console.log("🔍 gameDateTime value check:", {
    hasGameDateTime: !!gameDateTime,
    gameDateTime,
    type: typeof gameDateTime,
  })

  try {
    console.log("Making request to AIML API with:", {
      model: "google/gemini-2.5-flash-image-edit",
      imageUrls: imageUrls.length,
      prompt: prompt.substring(0, 100) + "...",
    })

    const response = await fetch(
      "https://api.aimlapi.com/v1/images/generations",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${AIML_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-image-edit",
          image_urls: imageUrls,
          prompt: prompt,
          num_images: 1,
        }),
      }
    )

    console.log("AIML API response status:", response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error("AIML API error response:", errorText)
      throw new Error(`AIML API error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    console.log("AIML API response data:", {
      hasImages: !!data.images,
      imagesCount: data.images?.length || 0,
      firstImageUrl: data.images?.[0]?.url,
    })

    // Handle the actual response structure from AIML API
    if (!data.images?.[0]?.url) {
      console.error("Invalid response structure:", data)
      throw new Error("No image generated in response")
    }

    const imageUrl = data.images[0].url
    console.log("Successfully generated image:", imageUrl)

    // Download the image and convert to base64
    const imageResponse = await fetch(imageUrl)
    const imageBuffer = await imageResponse.arrayBuffer()
    const base64 = Buffer.from(imageBuffer).toString("base64")

    console.log("Image converted to base64, length:", base64.length)

    // Apply logos and text to the generated image
    console.log("Applying logos and text to generated image...")
    const finalBase64 = await applyLogosToImage(
      base64,
      userName,
      gameLocation,
      gameDateTime,
      hasPremium
    )
    console.log(
      "Logos and text applied successfully, final image length:",
      finalBase64.length
    )

    return finalBase64
  } catch (error) {
    console.error("Error generating image:", error)
    throw error
  }
}
