import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

export async function GET(request: NextRequest) {
  console.log("=== BANANA IMAGE LIST API CALLED ===")
  
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const status = searchParams.get('status') // 'success', 'failed', 'processing'
    
    const offset = (page - 1) * limit
    
    console.log("Fetching records:", { page, limit, offset, status })

    // Build query
    let query = supabase
      .from('banana_images')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Filter by status if provided
    if (status) {
      query = query.eq('status', status)
    }

    const { data: records, error, count } = await query

    if (error) {
      console.error("Error fetching records:", error)
      throw error
    }

    // Get total count for pagination
    const { count: totalCount } = await supabase
      .from('banana_images')
      .select('*', { count: 'exact', head: true })

    console.log(`Found ${records?.length} records (${totalCount} total)`)

    return NextResponse.json({
      success: true,
      data: records || [],
      pagination: {
        page,
        limit,
        total: totalCount || 0,
        pages: Math.ceil((totalCount || 0) / limit),
        hasNext: offset + limit < (totalCount || 0),
        hasPrev: page > 1,
      }
    })
  } catch (error) {
    console.error("❌ Error fetching banana images:", error)
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        message: "Erro ao buscar registros.",
      },
      { status: 500 }
    )
  }
}