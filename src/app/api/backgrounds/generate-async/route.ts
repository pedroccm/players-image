import { NextRequest } from "next/server"

// Store para jobs em memória (em prod seria Redis/DB)
const jobs = new Map<
  string,
  {
    id: string
    status: "pending" | "processing" | "completed" | "failed"
    teamName: string
    result?: string[]
    error?: string
    createdAt: Date
  }
>()

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

    // Chamar API original (sem timeout limite)
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/backgrounds/generate-local`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamName, teamId }),
      }
    )

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
