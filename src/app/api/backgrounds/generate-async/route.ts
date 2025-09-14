import type { NextRequest } from "next/server"

import { jobs } from "@/lib/jobs-store"

export async function POST(request: NextRequest) {
  try {
    const { teamName, teamId } = await request.json()

    // Criar job ID único
    const jobId = `${teamId || teamName}_${Date.now()}`

    // Inicializar job
    jobs.set(jobId, {
      id: jobId,
      status: "pending",
      teamName,
      createdAt: new Date(),
    })

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
  const job = jobs.get(jobId)
  if (!job) return

  try {
    // Atualizar status
    job.status = "processing"
    jobs.set(jobId, job)

    // Chamar API original internamente (mesma instância, sem timeout HTTP)
    const { generateBackgroundForTeam } = await import(
      "../generate-local/route"
    )
    const mockRequest = {
      json: async () => ({ teamName, teamId }),
    } as NextRequest

    const response = await generateBackgroundForTeam(mockRequest)
    const result = await response.json()

    if (result.success) {
      job.status = "completed"
      job.result = result.urls
    } else {
      job.status = "failed"
      job.error = result.error
    }
  } catch (error) {
    job.status = "failed"
    job.error = error instanceof Error ? error.message : "Processing failed"
  } finally {
    jobs.set(jobId, job)
  }
}
