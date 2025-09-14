import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

import type { NextRequest } from "next/server"

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

export async function POST(request: NextRequest) {
  console.log("=== BANANAS IMAGE API CALLED ===")

  const startTime = Date.now()
  let recordId: string | null = null

  try {
    const { imageUrl1, imageUrl2, customPrompt } = await request.json()

    if (!imageUrl1) {
      return NextResponse.json(
        { error: "First image URL is required" },
        { status: 400 }
      )
    }

    if (!imageUrl2) {
      return NextResponse.json(
        { error: "Second image URL is required" },
        { status: 400 }
      )
    }

    if (!customPrompt || !customPrompt.trim()) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 })
    }

    console.log("Processing images:", imageUrl1, imageUrl2)
    console.log("With prompt:", customPrompt)

    // Get user info for tracking (optional)
    const userIp =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "unknown"
    const userAgent = request.headers.get("user-agent") || "unknown"

    // 1. Create initial record in database
    const { data: dbRecord, error: dbError } = await supabase
      .from("bananas_images")
      .insert({
        prompt: customPrompt,
        original_image_url_1: imageUrl1,
        original_image_url_2: imageUrl2,
        status: "processing",
        user_ip: userIp,
        user_agent: userAgent,
      })
      .select()
      .single()

    if (dbError) {
      console.error("Error creating database record:", dbError)
      // Continue anyway, don't fail the request
    } else {
      recordId = dbRecord.id
      console.log("Created database record:", recordId)
    }

    // 2. Call AI.ML API to generate image with both images
    const requestBody = {
      model: "google/gemini-2.5-flash-image-edit",
      prompt: customPrompt,
      image_urls: [imageUrl1, imageUrl2],
      num_images: 1,
    }

    console.log("Sending request to AI.ML")

    const response = await fetch(
      "https://api.aimlapi.com/v1/images/generations",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.AIML_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      }
    )

    if (!response.ok) {
      const errorData = await response.text()
      console.error("AI.ML API error:", errorData)

      // Update record with error
      if (recordId) {
        await supabase
          .from("bananas_images")
          .update({
            status: "failed",
            error_message: `AI.ML API error: ${response.status}`,
            processing_time_ms: Date.now() - startTime,
          })
          .eq("id", recordId)
      }

      if (response.status === 422) {
        return NextResponse.json({
          success: false,
          error: "content_blocked",
          message:
            "Essas imagens não puderam ser processadas. Por favor, tente outras.",
        })
      }

      throw new Error(`AI.ML API error: ${response.status}`)
    }

    const data = await response.json()
    console.log("AI.ML response received")

    // 3. Download generated image
    let imageBase64: string
    let generatedImageSize = 0

    if (data.images?.[0]?.url) {
      const imageUrl = data.images[0].url
      console.log("Downloading image from:", imageUrl)

      const imageResponse = await fetch(imageUrl)

      if (!imageResponse.ok) {
        console.error("Failed to download image:", imageResponse.status)

        // Update record with error
        if (recordId) {
          await supabase
            .from("bananas_images")
            .update({
              status: "failed",
              error_message: `Failed to download generated image: ${imageResponse.status}`,
              processing_time_ms: Date.now() - startTime,
            })
            .eq("id", recordId)
        }

        throw new Error(
          `Failed to download generated image: ${imageResponse.status}`
        )
      }

      const imageBuffer = await imageResponse.arrayBuffer()
      imageBase64 = Buffer.from(imageBuffer).toString("base64")
      generatedImageSize = imageBuffer.byteLength

      console.log(
        "Image downloaded and converted to base64, size:",
        generatedImageSize
      )
    } else {
      console.error("Unexpected response structure:", JSON.stringify(data))

      // Update record with error
      if (recordId) {
        await supabase
          .from("bananas_images")
          .update({
            status: "failed",
            error_message: "No image generated in response",
            processing_time_ms: Date.now() - startTime,
          })
          .eq("id", recordId)
      }

      throw new Error("No image generated in response")
    }

    // 4. Upload generated image to Supabase Storage
    const fileName = `bananas-${Date.now()}-${Math.random().toString(36).substring(7)}.png`
    const filePath = `generated/${fileName}`

    console.log("Uploading generated image to Supabase:", filePath)

    // Convert base64 to Uint8Array for upload
    const binaryString = atob(imageBase64)
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }

    const { error: uploadError } = await supabase.storage
      .from("fotos")
      .upload(filePath, bytes, {
        contentType: "image/png",
        upsert: false,
      })

    if (uploadError) {
      console.error("Error uploading to Supabase:", uploadError)
      // Don't fail the request, just log the error
    }

    // Get public URL for the uploaded image
    const {
      data: { publicUrl },
    } = supabase.storage.from("fotos").getPublicUrl(filePath)

    console.log("Generated image uploaded to:", publicUrl)

    // 5. Update database record with success
    if (recordId) {
      console.log("Updating database record with:", {
        generated_image_url: publicUrl,
        status: "success",
        processing_time_ms: Date.now() - startTime,
        generated_image_size: generatedImageSize,
      })

      const { data: updateData, error: updateError } = await supabase
        .from("bananas_images")
        .update({
          generated_image_url: publicUrl,
          status: "success",
          processing_time_ms: Date.now() - startTime,
          generated_image_size: generatedImageSize,
        })
        .eq("id", recordId)
        .select()

      if (updateError) {
        console.error("❌ Error updating database record:", updateError)
      } else {
        console.log("✅ Database record updated successfully:", updateData)
      }
    } else {
      console.warn("⚠️ No recordId to update!")
    }

    console.log("✅ Images processed successfully")
    console.log(`Total processing time: ${Date.now() - startTime}ms`)

    return NextResponse.json({
      success: true,
      imageBase64: imageBase64,
      publicUrl: publicUrl,
      recordId: recordId,
    })
  } catch (error) {
    console.error("❌ Error in bananas image generation:", error)

    // Update record with error if we have one
    if (recordId) {
      await supabase
        .from("bananas_images")
        .update({
          status: "error",
          error_message:
            error instanceof Error ? error.message : "Unknown error",
          processing_time_ms: Date.now() - startTime,
        })
        .eq("id", recordId)
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        message: "Erro ao processar as imagens. Tente novamente.",
      },
      { status: 500 }
    )
  }
}
