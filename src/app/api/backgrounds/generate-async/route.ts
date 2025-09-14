import type { NextRequest } from "next/server"

import { jobs } from "@/lib/jobs-store"

export async function POST(request: NextRequest) {
  try {
    const { teamName, teamId } = await request.json()

    // Criar job ID único
    const jobId = `${teamId || teamName}_${Date.now()}`

    console.log("🔥 Creating job:", jobId)
    console.log("Jobs store size before:", jobs.size)

    // Inicializar job
    jobs.set(jobId, {
      id: jobId,
      status: "pending",
      teamName,
      createdAt: new Date(),
    })

    console.log("✅ Job created:", jobs.get(jobId))
    console.log("Jobs store size after:", jobs.size)

    // Processar em background (não await)
    processBackgroundGeneration(jobId, teamName, teamId)

    // Retornar imediatamente com job ID
    return Response.json({
      success: true,
      jobId,
      status: "pending",
      message: "Background generation started",
    })
  } catch (error) {
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

// Função que roda em background
async function processBackgroundGeneration(
  jobId: string,
  teamName: string,
  teamId?: string
) {
  console.log("🚀 PROCESSING STARTED for:", jobId)

  const job = jobs.get(jobId)
  if (!job) {
    console.error("❌ Job not found in store:", jobId)
    return
  }

  console.log("📝 Job found, starting processing:", job)

  try {
    // Atualizar status
    job.status = "processing"
    jobs.set(jobId, job)

    console.log("✅ Status updated to processing")

    // Chamar função diretamente (sem HTTP interno)
    console.log("📞 Calling background generation directly...")
    const { generateBackgroundForTeam } = await import("../generate-local/route")

    // Criar mock request
    const mockRequest = {
      json: async () => ({ teamName, teamId })
    } as NextRequest

    const response = await generateBackgroundForTeam(mockRequest)
    const result = await response.json()

    console.log("📊 Direct call result:", result)

    if (result.success) {
      job.status = "completed"
      job.result = result.urls
      console.log("✅ Job completed successfully")
    } else {
      job.status = "failed"
      job.error = result.error
      console.log("❌ Job failed:", result.error)
    }
  } catch (error) {
    console.error("🔥 Processing error:", error)
    job.status = "failed"
    job.error = error instanceof Error ? error.message : "Processing failed"
  } finally {
    jobs.set(jobId, job)
    console.log("📋 Final job state:", job)
  }
}
