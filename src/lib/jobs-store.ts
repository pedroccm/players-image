// Store para jobs em memória (em prod seria Redis/DB)
export const jobs = new Map<
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