import { NextResponse } from "next/server"

import type { NextRequest } from "next/server"

import { convertFileToBase64, uploadImageToSupabase } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  console.log("=== UPLOAD TEST API CALLED ===")
  try {
    const formData = await request.formData()
    console.log("FormData received")

    const image1File = formData.get("image1File") as File | null
    const image2File = formData.get("image2File") as File | null
    const image1Url = formData.get("image1Url") as string | null
    const image2Url = formData.get("image2Url") as string | null

    console.log("Files received:", {
      image1File: image1File?.name || null,
      image2File: image2File?.name || null,
      image1Url: image1Url || null,
      image2Url: image2Url || null,
    })

    const results: any[] = []

    // Handle first image
    if (image1File) {
      console.log("Processing image1File...")
      try {
        const base64 = await convertFileToBase64(image1File)
        console.log("Base64 conversion successful for image1")

        const publicUrl = await uploadImageToSupabase(
          base64,
          `test-${Date.now()}-1.${image1File.type.split("/")[1]}`
        )
        console.log("Image1 uploaded successfully:", publicUrl)

        results.push({
          type: "file",
          name: image1File.name,
          url: publicUrl,
          status: "success",
        })
      } catch (error) {
        console.error("Error uploading image1:", error)
        results.push({
          type: "file",
          name: image1File.name,
          error: error instanceof Error ? error.message : "Unknown error",
          status: "error",
        })
      }
    } else if (image1Url) {
      console.log("Using image1Url:", image1Url)
      results.push({
        type: "url",
        url: image1Url,
        status: "success",
      })
    }

    // Handle second image
    if (image2File) {
      console.log("Processing image2File...")
      try {
        const base64 = await convertFileToBase64(image2File)
        console.log("Base64 conversion successful for image2")

        const publicUrl = await uploadImageToSupabase(
          base64,
          `test-${Date.now()}-2.${image2File.type.split("/")[1]}`
        )
        console.log("Image2 uploaded successfully:", publicUrl)

        results.push({
          type: "file",
          name: image2File.name,
          url: publicUrl,
          status: "success",
        })
      } catch (error) {
        console.error("Error uploading image2:", error)
        results.push({
          type: "file",
          name: image2File.name,
          error: error instanceof Error ? error.message : "Unknown error",
          status: "error",
        })
      }
    } else if (image2Url) {
      console.log("Using image2Url:", image2Url)
      results.push({
        type: "url",
        url: image2Url,
        status: "success",
      })
    }

    console.log("Upload test completed:", results)

    return NextResponse.json({
      success: true,
      results,
      message: "Upload test completed successfully",
    })
  } catch (error) {
    console.error("Error in upload test API:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}
