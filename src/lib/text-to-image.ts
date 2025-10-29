export interface TextImageOptions {
  text: string
  width?: number
  height?: number
  fontSize?: number
  textColor?: string
  backgroundColor?: string
  font?: string
}

export interface TextImageResponse {
  imageBuffer: Buffer
  width: number
  height: number
}

const LETTER_IMAGE_API_URL = "https://letter-image.onrender.com/render"

export async function generateTextImage(
  options: TextImageOptions
): Promise<TextImageResponse> {
  const {
    text,
    width = 800,
    height = 100,
    fontSize = 48,
    textColor = "#FFFFFF",
    backgroundColor = "#FFFFFF00", // Transparent
    font = "AghartiVF.ttf",
  } = options

  try {
    const params = new URLSearchParams({
      text: text,
      width: width.toString(),
      height: height.toString(),
      font_size: fontSize.toString(),
      text_color: textColor,
      background_color: backgroundColor,
      font: font,
    })

    const url = `${LETTER_IMAGE_API_URL}?${params.toString()}`
    console.log("📡 === LETTER-IMAGE API CALL ===")
    console.log("📡 FULL URL:", url)
    console.log("📡 PARAMETERS:", {
      text,
      width,
      height,
      fontSize,
      textColor,
      backgroundColor,
      font,
    })

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "User-Agent": "PlayerCX/1.0",
      },
    })

    if (!response.ok) {
      throw new Error(
        `Letter-Image API error: ${response.status} - ${response.statusText}`
      )
    }

    const imageBuffer = Buffer.from(await response.arrayBuffer())
    console.log("✅ Text image generated successfully:", {
      size: imageBuffer.length,
      contentType: response.headers.get("content-type"),
    })

    return {
      imageBuffer,
      width,
      height,
    }
  } catch (error) {
    console.error("❌ Error generating text image:", error)

    // Fallback: create transparent SVG text overlay
    const fallbackSvg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg" style="background: transparent;">
      <text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle"
            font-family="Arial, sans-serif" font-size="${fontSize}" font-weight="bold" 
            fill="${textColor}" stroke="#FFFFFF" stroke-width="2">
        ${text}
      </text>
    </svg>`

    const fallbackBuffer = Buffer.from(fallbackSvg)
    console.log("🔧 Using fallback SVG for text:", text)

    return {
      imageBuffer: fallbackBuffer,
      width,
      height,
    }
  }
}

export async function generateUserNameImage(
  userName: string
): Promise<TextImageResponse> {
  console.log("🔤 Generating username image:", userName)
  return generateTextImage({
    text: userName,
    width: 800,
    height: 100,
    fontSize: 48,
    font: "AghartiVF.ttf",
    textColor: "#FFFFFF",
    backgroundColor: "transparent", // Try transparent keyword
  })
}

export async function generateGameLocationImage(
  gameLocation: string
): Promise<TextImageResponse> {
  console.log("📍 === GENERATING GAME LOCATION IMAGE ===")
  console.log("📍 Input text:", gameLocation)

  const options = {
    text: gameLocation.toUpperCase(), // Force CAPS LOCK
    width: 400,
    height: 60,
    fontSize: 44, // Increased from 42px to 44px (+2px)
    font: "Agharti-Bold.ttf", // Use bold variant
    textColor: "#000000", // Black text
    backgroundColor: "transparent",
  }

  console.log("📍 Location image options:", options)

  return generateTextImage(options)
}

export async function generateGameDateTimeImage(
  gameDateTime: string
): Promise<TextImageResponse> {
  console.log("🕒 === GENERATING GAME DATETIME IMAGE ===")
  console.log("🕒 Input text:", gameDateTime)
  console.log("🕒 Input details:", {
    value: gameDateTime,
    type: typeof gameDateTime,
    length: gameDateTime?.length,
    upperCased: gameDateTime.toUpperCase(),
  })

  const options = {
    text: gameDateTime.toUpperCase(), // Force CAPS LOCK
    width: 400,
    height: 60,
    fontSize: 49, // Increased from 47px to 49px (+2px)
    font: "Agharti-Bold.ttf", // Use bold variant
    textColor: "#000000", // Black text
    backgroundColor: "transparent",
  }

  console.log("🕒 DateTime image options:", options)

  const result = await generateTextImage(options)
  console.log(
    "🕒 DateTime image generated, buffer size:",
    result.imageBuffer.length
  )

  return result
}
