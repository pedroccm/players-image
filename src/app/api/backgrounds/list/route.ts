import { createClient } from "@supabase/supabase-js"

import type { NextRequest } from "next/server"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const teamName = searchParams.get("teamName")

    if (!teamName) {
      return Response.json(
        { success: false, error: "Team name is required" },
        { status: 400 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // List files in the team's folder (directly under fotos/)
    const { data, error } = await supabase.storage
      .from("fotos")
      .list(teamName, {
        limit: 10,
        sortBy: { column: "created_at", order: "desc" },
      })

    if (error) {
      console.error("❌ Supabase list error:", error)
      return Response.json(
        { success: false, error: "Failed to list backgrounds" },
        { status: 500 }
      )
    }

    // Convert file list to URLs
    const backgroundUrls =
      data
        ?.filter(
          (file) => file.name.endsWith(".png") || file.name.endsWith(".jpg")
        )
        .map((file) => {
          return `${supabaseUrl}/storage/v1/object/public/fotos/${teamName}/${file.name}`
        }) || []

    return Response.json({
      success: true,
      teamName,
      count: backgroundUrls.length,
      urls: backgroundUrls,
    })
  } catch (error) {
    console.error("❌ Error listing backgrounds:", error)
    return Response.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to list backgrounds",
      },
      { status: 500 }
    )
  }
}
