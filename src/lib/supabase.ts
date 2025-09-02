import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export async function uploadImageToSupabase(
  imageBase64: string,
  fileName?: string
): Promise<string> {
  try {
    console.log("Converting base64 to blob...")
    // Convert base64 to blob
    const base64Response = await fetch(`data:image/png;base64,${imageBase64}`)
    const blob = await base64Response.blob()
    console.log("Blob created, size:", blob.size)

    // Generate filename if not provided
    const finalFileName = fileName || `ai-generated-${Date.now()}.png`
    console.log("Uploading to Supabase with filename:", finalFileName)

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from("fotos")
      .upload(finalFileName, blob, {
        contentType: "image/png",
        upsert: true,
      })

    console.log("Supabase upload result:", { data, error })

    if (error) {
      throw error
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from("fotos")
      .getPublicUrl(data.path)

    return publicUrlData.publicUrl
  } catch (error) {
    console.error("Error uploading image to Supabase:", error)
    throw error
  }
}

export async function convertFileToBase64(file: File): Promise<string> {
  // Convert File to ArrayBuffer then to Buffer for server-side processing
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  const base64 = buffer.toString('base64')
  return base64
}
