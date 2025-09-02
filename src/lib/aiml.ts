import { OpenAI } from "openai"

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

export async function generateImage(
  prompt: string,
  imageUrls: string[]
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
    return base64
  } catch (error) {
    console.error("Error generating image:", error)
    throw error
  }
}
