import { jobs } from "@/lib/jobs-store"

export async function GET() {
  console.log("🔍 Checking jobs store...")
  console.log("Jobs store size:", jobs.size)
  console.log("All jobs:", Array.from(jobs.entries()))

  return Response.json({
    success: true,
    jobsCount: jobs.size,
    allJobs: Array.from(jobs.entries()),
    timestamp: new Date().toISOString(),
  })
}