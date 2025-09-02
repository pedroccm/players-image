import { NextResponse } from "next/server"

import type { NextRequest } from "next/server"

import { generateImage } from "@/lib/aiml"
import { convertFileToBase64, uploadImageToSupabase } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  console.log("=== API ROUTE CALLED ===")
  try {
    const formData = await request.formData()
    console.log("Received request to generate image")

    const prompt = formData.get("prompt") as string
    const image1File = formData.get("image1File") as File | null
    const image2File = formData.get("image2File") as File | null
    const image1Url = formData.get("image1Url") as string | null
    const image2Url = formData.get("image2Url") as string | null

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 })
    }

    // Collect image URLs
    const imageUrls: string[] = []

    // Handle first image
    if (image1File) {
      console.log("Uploading image1File to Supabase...")
      const base64 = await convertFileToBase64(image1File)
      const publicUrl = await uploadImageToSupabase(
        base64,
        `temp-${Date.now()}-1.${image1File.type.split("/")[1]}`
      )
      console.log("Image1 uploaded to:", publicUrl)
      imageUrls.push(publicUrl)
    } else if (image1Url) {
      console.log("Using image1Url:", image1Url)
      imageUrls.push(image1Url)
    }

    // Handle second image
    if (image2File) {
      console.log("Uploading image2File to Supabase...")
      const base64 = await convertFileToBase64(image2File)
      const publicUrl = await uploadImageToSupabase(
        base64,
        `temp-${Date.now()}-2.${image2File.type.split("/")[1]}`
      )
      console.log("Image2 uploaded to:", publicUrl)
      imageUrls.push(publicUrl)
    } else if (image2Url) {
      console.log("Using image2Url:", image2Url)
      imageUrls.push(image2Url)
    }

    if (imageUrls.length !== 2) {
      return NextResponse.json(
        { error: "Exactly 2 images are required" },
        { status: 400 }
      )
    }

    console.log("Generating image with:", {
      prompt,
      imageUrlsCount: imageUrls.length,
      imageUrls: imageUrls.map((url) => url.substring(0, 50) + "..."),
    })

    // Generate image using AIML API
    const imageBase64 = await generateImage(prompt, imageUrls)

    return NextResponse.json({
      imageBase64,
      prompt,
    })
  } catch (error) {
    console.error("Error in generate image API:", error)
    return NextResponse.json(
      { error: "Failed to generate image" },
      { status: 500 }
    )
  }
}
