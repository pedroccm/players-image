import path from "path"

import { OpenAI } from "openai"
import sharp from "sharp"

import {
  generateGameLocationImage,
  generateUserNameImage,
} from "./text-to-image"

// Note: Agharti font is now handled by Letter-Image API

export const aimlClient = new OpenAI({
  baseURL: "https://api.aimlapi.com/v1",
  apiKey: "a2c4457ed6a14299a425dd670e5a8ad0",
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
  gameLocation?: string
): Promise<string> {
  console.log("🎨 === STARTING OVERLAY APPLICATION ===")
  console.log("📊 Input parameters:", { userName, gameLocation, imageLength: base64Image.length })
  
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
    
    // Get original dimensions of escudos-shape.png and resize to fit image width
    const escudosMetadata = await sharp(escudosShapePath).metadata()
    const maxEscudosWidth = Math.floor(width * 0.8) // 80% of main image width
    const aspectRatio = escudosMetadata.height / escudosMetadata.width
    const escudosWidth = maxEscudosWidth
    const escudosHeight = Math.floor(maxEscudosWidth * aspectRatio)
    
    console.log("🖼️ [Image #1] escudos-shape dimensions:", {
      original: `${escudosMetadata.width}x${escudosMetadata.height}`,
      resized: `${escudosWidth}x${escudosHeight}`,
      maxWidth: maxEscudosWidth
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
      spfc: spfcLogoPath
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
      spfcSize: spfcLogo.length
    })

    // Generate text overlays using Letter-Image API
    const textOverlays = []

    // Username text removed - only show game location

    // Add gameLocation text if provided
    if (gameLocation) {
      console.log(
        "📍 Generating game location image via Letter-Image API:",
        gameLocation
      )
      const gameLocationImageData =
        await generateGameLocationImage(gameLocation)

      // Resize to fit image width and position at bottom center (no username anymore)
      const resizedGameLocationImage = await sharp(
        gameLocationImageData.imageBuffer
      )
        .resize(width, 120, { // Increased height for 72px font
          fit: "contain",
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        })
        .png()
        .toBuffer()

      textOverlays.push({
        input: resizedGameLocationImage,
        top: height - 150, // Bottom position (no username to avoid)
        left: 0,
      })

      console.log("📍 Game location text positioned at bottom")
    }

    // Apply logos and text overlays (no background image)
    const composite = [
      // [Image #1] escudos-shape at 50% size
      {
        input: escudosShape,
        top: Math.min(1000, height - escudosHeight - 50), // Max 1000px or fit in image
        left: Math.floor((width - escudosWidth) / 2), // Centered
      },
      // Logos
      {
        input: portuguesaLogo,
        top: 30, // Top
        left: 30, // Left
      },
      {
        input: spfcLogo,
        top: 30, // Top
        left: width - logoSize - 30, // Right
      },
      // Text overlays
      ...textOverlays,
    ]

    console.log("🎯 Compositing final image with", composite.length, "overlays")
    console.log("🎯 Composite array:", composite.map(c => ({ 
      hasInput: !!c.input, 
      top: c.top, 
      left: c.left 
    })))
    
    const result = await mainImage.composite(composite).png().toBuffer()

    console.log("✅ Overlay application completed successfully!")
    console.log("📊 Final image size:", result.length, "bytes")

    // Convert back to base64
    return result.toString("base64")
  } catch (error) {
    console.error("❌ ERROR applying logos and text:", error)
    console.error("❌ Error stack:", error.stack)
    // Return original image if processing fails
    return base64Image
  }
}

export async function generateImage(
  prompt: string,
  imageUrls: string[],
  userName?: string,
  gameLocation?: string
): Promise<string> {
  console.log("🚀 === GENERATE IMAGE CALLED ===")
  console.log("📋 Parameters:", { userName, gameLocation, imageCount: imageUrls.length })
  
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
          Authorization: `Bearer a2c4457ed6a14299a425dd670e5a8ad0`,
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
    const finalBase64 = await applyLogosToImage(base64, userName, gameLocation)
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
