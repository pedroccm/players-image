import { NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  const jobId = request.nextUrl.searchParams.get("jobId")

  if (!jobId) {
    return Response.json(
      {
        success: false,
        error: "Job ID required",
      },
      { status: 400 }
    )
  }

  // Aqui você checaria o status no seu storage
  // Por enquanto, simulando
  return Response.json({
    success: true,
    jobId,
    status: "completed", // pending | processing | completed | failed
    result: ["https://example.com/bg1.png"],
    progress: 100,
  })
}
