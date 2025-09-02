import { NextResponse } from "next/server"

import type { NextRequest } from "next/server"

import { uploadImageToSupabase } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const { imageBase64, prompt } = await request.json()

    if (!imageBase64) {
      return NextResponse.json(
        { error: "Image data is required" },
        { status: 400 }
      )
    }

    // Generate filename based on prompt (first 50 chars, sanitized)
    const sanitizedPrompt = prompt
      ?.substring(0, 50)
      .replace(/[^a-zA-Z0-9\s]/g, "")
      .replace(/\s+/g, "-")
      .toLowerCase()

    const fileName = `ai-${sanitizedPrompt || "generated"}-${Date.now()}.png`

    // Upload to Supabase
    const publicUrl = await uploadImageToSupabase(imageBase64, fileName)

    return NextResponse.json({
      success: true,
      publicUrl,
      fileName,
    })
  } catch (error) {
    console.error("Error in upload image API:", error)
    return NextResponse.json(
      { error: "Failed to upload image" },
      { status: 500 }
    )
  }
}
