import { NextRequest } from "next/server"

export async function POST(request: NextRequest) {
  console.log("=== BACKGROUNDS GENERATE API CALLED ===")
  
  try {
    const { teamName } = await request.json()
    
    console.log("🏆 Generating backgrounds for team:", teamName)
    
    if (!teamName) {
      return Response.json(
        { success: false, error: "Team name is required" },
        { status: 400 }
      )
    }

    // Call external API 3 times sequentially to get 3 backgrounds
    const allUrls: string[] = []
    
    for (let i = 1; i <= 3; i++) {
      try {
        console.log(`🌐 Making API call ${i}/3...`)
        
        const response = await fetch('https://letter-image.onrender.com/generate-team-backgrounds', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            team_name: teamName,
            size: "1024x1536",
            quality: "low",
            count: 1
          })
        })
        
        console.log(`🌐 API call ${i} response status:`, response.status)
        
        if (!response.ok) {
          console.error(`❌ API call ${i} failed with status:`, response.status)
          continue // Try next call
        }
        
        const data = await response.json()
        console.log(`📊 API call ${i} data:`, data)
        
        if (data.urls && Array.isArray(data.urls)) {
          allUrls.push(...data.urls)
          console.log(`✅ API call ${i} successful, total URLs: ${allUrls.length}`)
        } else {
          console.error(`❌ API call ${i} returned invalid data format`)
        }
        
      } catch (error) {
        console.error(`❌ API call ${i} error:`, error)
        // Continue to next call
      }
    }
    
    if (allUrls.length > 0) {
      return Response.json({
        success: true,
        count: allUrls.length,
        team_name: teamName,
        urls: allUrls
      })
    } else {
      throw new Error("All 3 API calls failed")
    }
    
  } catch (error) {
    console.error("❌ Error generating backgrounds:", error)
    
    return Response.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to generate backgrounds" 
      },
      { status: 500 }
    )
  }
}