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
  homeTeam?: string,
  awayTeam?: string,
  generateBothVersions: boolean = false
): Promise<{
  finalImage: string
  premiumImage?: string
  locationImage?: string
  datetimeImage?: string
}> {
  console.log("🎨 === STARTING OVERLAY APPLICATION ===")
  console.log("📊 Input parameters:", {
    userName,
    homeTeam,
    awayTeam,
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

    // Dynamic logo paths based on selected teams
    const getTeamLogoPath = (teamId?: string): string => {
      if (!teamId) {
        // Fallback to default portuguesa if no team selected
        return path.join(process.cwd(), "public", "images", "portuguesa.png")
      }

      // First, try with SVG extension
      const svgPath = path.join(
        process.cwd(),
        "public",
        "escudos_2025",
        `${teamId}.svg`
      )
      const pngPath = path.join(
        process.cwd(),
        "public",
        "escudos_2025",
        `${teamId}.png`
      )

      // Check which file exists (both SVG and PNG are supported by Sharp)
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const fs = require("fs")
      if (fs.existsSync(svgPath)) {
        return svgPath
      } else if (fs.existsSync(pngPath)) {
        return pngPath
      } else {
        console.warn(`❌ Team logo not found for: ${teamId}, using fallback`)
        return path.join(process.cwd(), "public", "images", "portuguesa.png")
      }
    }

    const homeTeamLogoPath = getTeamLogoPath(homeTeam)
    const awayTeamLogoPath = getTeamLogoPath(awayTeam)

    console.log("🏆 Loading logos:", {
      homeTeam: homeTeamLogoPath,
      awayTeam: awayTeamLogoPath,
    })

    // Fixed logo size to 70x70 pixels
    const logoSize = 70
    console.log("📏 Logo size fixed:", logoSize, "px")

    // Resize logos
    const homeTeamLogo = await sharp(homeTeamLogoPath)
      .resize(logoSize, logoSize, {
        fit: "contain",
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png()
      .toBuffer()

    const awayTeamLogo = await sharp(awayTeamLogoPath)
      .resize(logoSize, logoSize, {
        fit: "contain",
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png()
      .toBuffer()

    console.log("✅ Logos processed successfully:", {
      homeTeamSize: homeTeamLogo.length,
      awayTeamSize: awayTeamLogo.length,
    })

    // Generate text overlays using Letter-Image API
    const textOverlays = []
    let locationImageBase64: string | undefined
    let datetimeImageBase64: string | undefined

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
      try {
        const gameLocationImageData =
          await generateGameLocationImage(gameLocation)

        console.log("📍 Game location image generated:", {
          bufferSize: gameLocationImageData.imageBuffer.length,
          width: gameLocationImageData.width,
          height: gameLocationImageData.height,
        })

        // Use image exactly as returned from API - no resize or crop
        textOverlays.push({
          input: gameLocationImageData.imageBuffer,
          top: 1088, // y: 1088 (moved up 5px from 1093)
          left: 162, // x: 162
        })

        console.log("📍 Game location text positioned at bottom")
        console.log(
          "📍 textOverlays after adding location:",
          textOverlays.length
        )

        // Store location image for separate display
        console.log("📍 Storing location image for separate display")
        locationImageBase64 =
          gameLocationImageData.imageBuffer.toString("base64")
        console.log(
          "📍 Location image stored, size:",
          locationImageBase64.length
        )
      } catch (error) {
        console.error("❌ Error generating location image:", error)
        console.error("❌ Will continue without location image")
      }
    }

    // Add gameDateTime text if provided
    console.log("🔍 Checking gameDateTime:", {
      gameDateTime,
      hasValue: !!gameDateTime,
      type: typeof gameDateTime,
      length: gameDateTime?.length,
      trimmed: gameDateTime?.trim?.(),
    })
    if (gameDateTime && gameDateTime.trim()) {
      console.log(
        "🕒 Generating game date/time image via Letter-Image API:",
        gameDateTime
      )
      try {
        const gameDateTimeImageData =
          await generateGameDateTimeImage(gameDateTime)

        console.log("🕒 Game date/time image generated:", {
          bufferSize: gameDateTimeImageData.imageBuffer.length,
          width: gameDateTimeImageData.width,
          height: gameDateTimeImageData.height,
        })

        // Use image exactly as returned from API - no resize or crop
        textOverlays.push({
          input: gameDateTimeImageData.imageBuffer,
          top: 1143, // y: 1143 (moved up 5px from 1148)
          left: 162, // x: 162
        })

        console.log("🕒 Game date/time text positioned below location")
        console.log(
          "🕒 textOverlays after adding datetime:",
          textOverlays.length
        )

        // Store datetime image for separate display
        console.log("🕒 Storing datetime image for separate display")
        datetimeImageBase64 =
          gameDateTimeImageData.imageBuffer.toString("base64")
        console.log(
          "🕒 Datetime image stored, size:",
          datetimeImageBase64.length
        )
      } catch (error) {
        console.error("❌ Error generating datetime image:", error)
        console.error("❌ Will continue without datetime image")
      }
    } else {
      console.log("❌ gameDateTime not provided or empty")
    }

    // Apply logos and text overlays (no background image)
    const composite = [
      // [Image #1] escudos-shape at fixed 500px width
      {
        input: escudosShape,
        top: 1050, // y: 1050
        left: -16, // x: -16 (moved 1px left from -15)
      },
      // Logos
      {
        input: homeTeamLogo,
        top: 1059, // y: 1059
        left: 50, // x: 50 (moved 1px left from 51)
      },
      {
        input: awayTeamLogo,
        top: 1145, // y: 1145
        left: 50, // x: 50 (moved 1px left from 51)
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

    // Generate both versions if requested
    let finalResult = result
    let premiumResult: Buffer | undefined

    if (generateBothVersions) {
      console.log("🎨 Generating BOTH versions (with and without watermark)...")

      // Premium version = result without watermark (already done)
      premiumResult = result

      // Free version = result WITH watermark
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
        console.log("✅ Both versions generated!")
      } catch (watermarkError) {
        console.error("❌ Error applying watermark:", watermarkError)
        console.log("📦 Using image without watermark as fallback")
        finalResult = result // Use original if watermark fails
      }
    }

    console.log("📊 Final image size:", finalResult.length, "bytes")

    // Convert back to base64 and return with text images
    return {
      finalImage: finalResult.toString("base64"),
      premiumImage: premiumResult?.toString("base64"),
      locationImage: locationImageBase64,
      datetimeImage: datetimeImageBase64,
    }
  } catch (error) {
    console.error("❌ ERROR applying logos and text:", error)
    console.error(
      "❌ Error stack:",
      error instanceof Error ? error.stack : "No stack trace"
    )
    // Return original image if processing fails
    return {
      finalImage: base64Image,
      locationImage: undefined,
      datetimeImage: undefined,
    }
  }
}

export async function generateImageWithTextImages(
  prompt: string,
  imageUrls: string[],
  userName?: string,
  gameLocation?: string,
  gameDateTime?: string,
  homeTeam?: string,
  awayTeam?: string,
  generateBothVersions: boolean = false
): Promise<{
  finalImage: string
  premiumImage?: string
  locationImage?: string
  datetimeImage?: string
}> {
  console.log("🚀 === GENERATE IMAGE WITH TEXT IMAGES CALLED ===")
  console.log("📋 Parameters:", {
    userName,
    gameLocation,
    gameDateTime,
    imageCount: imageUrls.length,
  })

  try {
    console.log("🌐 Calling AIML API with:", {
      url: "https://api.aimlapi.com/v1/images/generations",
      model: "google/gemini-2.5-flash-image-edit",
      imageUrlsCount: imageUrls.length,
      promptLength: prompt.length,
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

    console.log("📊 AIML API response status:", response.status)
    console.log("📊 AIML API response headers:", {
      contentType: response.headers.get("content-type"),
      contentLength: response.headers.get("content-length"),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("❌ AIML API error response:", errorText)
      throw new Error(`AIML API error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()

    console.log("📦 AIML API full response:", JSON.stringify(data, null, 2))
    console.log("🔍 Response structure check:", {
      hasData: !!data,
      hasDataArray: !!data.data,
      dataType: typeof data.data,
      dataIsArray: Array.isArray(data.data),
      dataLength: data.data?.length,
      firstData: data.data?.[0],
      hasUrl: !!data.data?.[0]?.url,
      dataKeys: Object.keys(data),
    })

    // API retorna data.data[0].url, não data.images[0].url
    if (!data.data?.[0]?.url) {
      console.error("❌ Invalid response structure - missing data[0].url")
      console.error("📦 Full data object:", data)
      throw new Error("No image generated in response")
    }

    const imageUrl = data.data[0].url
    const imageResponse = await fetch(imageUrl)
    const imageBuffer = await imageResponse.arrayBuffer()
    const base64 = Buffer.from(imageBuffer).toString("base64")

    // Apply logos and text to the generated image
    const result = await applyLogosToImage(
      base64,
      userName,
      gameLocation,
      gameDateTime,
      homeTeam,
      awayTeam,
      generateBothVersions
    )

    return result
  } catch (error) {
    console.error("Error generating image with text images:", error)
    throw error
  }
}

export async function generateImage(
  prompt: string,
  imageUrls: string[],
  userName?: string,
  gameLocation?: string,
  gameDateTime?: string,
  homeTeam?: string,
  awayTeam?: string,
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

      // Handle specific timeout error (524)
      if (response.status === 524) {
        throw new Error(
          "O servidor AIML está temporariamente sobrecarregado. Tente novamente em alguns minutos."
        )
      }

      throw new Error(`AIML API error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    console.log("AIML API response data:", {
      hasData: !!data.data,
      dataCount: data.data?.length || 0,
      firstDataUrl: data.data?.[0]?.url,
    })

    // Handle the actual response structure from AIML API
    // API retorna data.data[0].url, não data.images[0].url
    if (!data.data?.[0]?.url) {
      console.error("Invalid response structure:", data)
      throw new Error("No image generated in response")
    }

    const imageUrl = data.data[0].url
    console.log("Successfully generated image:", imageUrl)

    // Download the image and convert to base64
    const imageResponse = await fetch(imageUrl)
    const imageBuffer = await imageResponse.arrayBuffer()
    const base64 = Buffer.from(imageBuffer).toString("base64")

    console.log("Image converted to base64, length:", base64.length)

    // Apply logos and text to the generated image
    console.log("Applying logos and text to generated image...")
    const result = await applyLogosToImage(
      base64,
      userName,
      gameLocation,
      gameDateTime,
      homeTeam,
      awayTeam,
      hasPremium
    )
    console.log(
      "Logos and text applied successfully, final image length:",
      result.finalImage.length
    )

    return result.finalImage
  } catch (error) {
    console.error("Error generating image:", error)
    throw error
  }
}
