import type { NextRequest } from "next/server"

import { jobs } from "@/lib/jobs-store"

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

  // Get job from memory store
  const job = jobs.get(jobId)

  if (!job) {
    return Response.json(
      {
        success: false,
        error: "Job not found",
      },
      { status: 404 }
    )
  }

  // Calculate progress based on status
  let progress = 0
  switch (job.status) {
    case "pending":
      progress = 0
      break
    case "processing":
      progress = 50
      break
    case "completed":
      progress = 100
      break
    case "failed":
      progress = 0
      break
  }

  return Response.json({
    success: true,
    jobId,
    status: job.status,
    result: job.result || [],
    error: job.error,
    progress,
    teamName: job.teamName,
  })
}
