import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

import { convertFileToBase64, uploadImageToSupabase } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  console.log("=== CHAT IMAGE UPLOAD API CALLED ===")
  try {
    const formData = await request.formData()
    const imageFile = formData.get("image") as File | null

    if (!imageFile) {
      return NextResponse.json(
        { error: "No image provided" },
        { status: 400 }
      )
    }

    console.log("Processing image file:", imageFile.name)
    
    // Convert to base64
    const base64 = await convertFileToBase64(imageFile)
    
    // Upload to Supabase
    const fileName = `chat-${Date.now()}.${imageFile.type.split("/")[1]}`
    const publicUrl = await uploadImageToSupabase(base64, fileName)
    
    console.log("Image uploaded successfully:", publicUrl)
    
    return NextResponse.json({
      success: true,
      url: publicUrl,
      fileName,
    })
  } catch (error) {
    console.error("Error in chat image upload:", error)
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}