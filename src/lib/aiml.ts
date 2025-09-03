import { OpenAI } from "openai"
import sharp from "sharp"
import path from "path"
import fs from "fs"

// Load and encode custom font
let aghartiBase64: string | null = null
try {
  const fontPath = path.join(process.cwd(), "public", "fonts", "AghartiVF.ttf")
  const fontBuffer = fs.readFileSync(fontPath)
  aghartiBase64 = fontBuffer.toString('base64')
  console.log("Agharti font loaded successfully")
} catch (error) {
  console.warn("Could not load Agharti font:", error)
}

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

async function applyLogosToImage(base64Image: string, userName?: string, gameLocation?: string): Promise<string> {
  try {
    // Convert base64 to buffer
    const imageBuffer = Buffer.from(base64Image, "base64")
    
    // Load the main image
    let mainImage = sharp(imageBuffer)
    const { width, height } = await mainImage.metadata()
    
    if (!width || !height) {
      throw new Error("Could not get image dimensions")
    }
    
    // Logo paths
    const portuguesaLogoPath = path.join(process.cwd(), "public", "images", "portuguesa.png")
    const spfcLogoPath = path.join(process.cwd(), "public", "images", "spfc.png")
    
    // Calculate logo size (10% of image width)
    const logoSize = Math.floor(width * 0.1)
    
    // Resize logos
    const portuguesaLogo = await sharp(portuguesaLogoPath)
      .resize(logoSize, logoSize, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer()
      
    const spfcLogo = await sharp(spfcLogoPath)
      .resize(logoSize, logoSize, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer()
    
    // Create text overlays using SVG
    let textOverlays = []
    
    // Add userName text if provided
    if (userName) {
      const userNameSvg = `
      <svg width="${width}" height="100">
        <text x="50%" y="70" text-anchor="middle" 
              font-family="Arial" font-size="48" font-weight="bold" 
              fill="white" stroke="black" stroke-width="3">
          ${userName}
        </text>
      </svg>`
      
      textOverlays.push({
        input: Buffer.from(userNameSvg),
        top: height - 150, // 150px from bottom
        left: 0,
      })
    }
    
    // Add gameLocation text if provided  
    if (gameLocation) {
      const fontDef = aghartiBase64 
        ? `<defs>
             <style>
               @font-face {
                 font-family: 'Agharti';
                 src: url(data:font/truetype;charset=utf-8;base64,${aghartiBase64}) format('truetype');
               }
             </style>
           </defs>`
        : '';
        
      const fontFamily = aghartiBase64 ? 'Agharti' : 'Arial';
      
      const gameLocationSvg = `
      <svg width="${width}" height="80">
        ${fontDef}
        <text x="50%" y="50" text-anchor="middle" 
              font-family="${fontFamily}" font-size="36" 
              fill="white" stroke="black" stroke-width="2">
          ${gameLocation}
        </text>
      </svg>`
      
      textOverlays.push({
        input: Buffer.from(gameLocationSvg),
        top: userName ? height - 220 : height - 120, // Above userName if exists, 120px from bottom if not
        left: 0,
      })
    }
    
    // Apply logos with corrected positions: top right and top left
    const composite = [
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
      ...textOverlays
    ]
    
    const result = await mainImage
      .composite(composite)
      .png()
      .toBuffer()
    
    // Convert back to base64
    return result.toString("base64")
  } catch (error) {
    console.error("Error applying logos and text:", error)
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
    console.log("Logos and text applied successfully, final image length:", finalBase64.length)
    
    return finalBase64
  } catch (error) {
    console.error("Error generating image:", error)
    throw error
  }
}
