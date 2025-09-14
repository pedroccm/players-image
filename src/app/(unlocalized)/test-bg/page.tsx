"use client"

import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"

import { ALL_TEAMS } from "@/lib/teams"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface TestResult {
  success: boolean
  teamName: string
  logoPath: string
  background: string
  urls?: string[]
  error?: string
  logs: string[]
}

export default function TestBackgroundsPage() {
  const [isGenerating, setIsGenerating] = useState(false)
  const [result, setResult] = useState<TestResult | null>(null)
  const [startTime, setStartTime] = useState<number | null>(null)
  const [elapsedTime, setElapsedTime] = useState<number>(0)

  // Cronômetro
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (isGenerating && startTime) {
      interval = setInterval(() => {
        setElapsedTime(Date.now() - startTime)
      }, 100) // Atualiza a cada 100ms para fluidez
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isGenerating, startTime])

  const formatTime = (ms: number) => {
    const seconds = (ms / 1000).toFixed(1)
    return `${seconds}s`
  }

  const generateTestBackground = async () => {
    const start = Date.now()
    setStartTime(start)
    setIsGenerating(true)
    setResult(null)
    setElapsedTime(0)

    const logs: string[] = []

    try {
      logs.push("🎯 Iniciando teste de geração de backgrounds...")

      // 1. Selecionar time aleatório (apenas PNG)
      const pngTeams = ALL_TEAMS.filter((team) =>
        team.logoPath.endsWith(".png")
      )

      if (pngTeams.length === 0) {
        throw new Error("Nenhum time com logo PNG encontrado")
      }

      const randomTeam = pngTeams[Math.floor(Math.random() * pngTeams.length)]
      logs.push(`🏆 Time selecionado: ${randomTeam.name} (${randomTeam.id})`)
      logs.push(`📁 Logo path: ${randomTeam.logoPath}`)

      // 2. Simular seleção de background (será feito pela API)
      const mockBackgrounds = [
        "bg1.png",
        "bg2.png",
        "bg3.png",
        "bg4.png",
        "bg5.png",
        "bg10.png",
        "bg15.png",
        "bg20.png",
        "bg25.png",
        "bg30.png",
      ]
      const selectedBg =
        mockBackgrounds[Math.floor(Math.random() * mockBackgrounds.length)]
      logs.push(`🖼️ Background simulado: ${selectedBg}`)

      // 3. Chamar API local
      logs.push("🌐 Chamando API local...")

      const apiResponse = await fetch("/api/backgrounds/generate-local", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamName: randomTeam.name }),
      })

      logs.push(`📊 Status da API: ${apiResponse.status}`)

      const data = await apiResponse.json()
      logs.push(`📝 Resposta da API: ${JSON.stringify(data, null, 2)}`)

      if (data.success) {
        const endTime = Date.now()
        const totalTime = endTime - start
        logs.push("✅ Background gerado com sucesso!")
        logs.push(`⏱️ Tempo total: ${formatTime(totalTime)}`)

        setResult({
          success: true,
          teamName: randomTeam.name,
          logoPath: randomTeam.logoPath,
          background: selectedBg,
          urls: data.urls,
          logs,
        })
      } else {
        throw new Error(data.error || "Erro desconhecido da API")
      }
    } catch (error) {
      console.error("❌ Erro no teste:", error)
      logs.push(
        `❌ ERRO: ${error instanceof Error ? error.message : String(error)}`
      )

      setResult({
        success: false,
        teamName: "N/A",
        logoPath: "N/A",
        background: "N/A",
        error: error instanceof Error ? error.message : String(error),
        logs,
      })
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-primary/10 border-b px-6 py-4">
        <h1 className="text-xl font-semibold">
          🧪 Teste de Geração de Backgrounds V002
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Página para testar a nova API local de geração de backgrounds
        </p>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle>Teste Automatizado</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">Este teste irá:</p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Selecionar um time aleatório (apenas PNG)</li>
              <li>Pegar um background aleatório da pasta bgs/</li>
              <li>Chamar a API local /api/backgrounds/generate-local</li>
              <li>Mostrar todos os logs detalhados</li>
              <li>Exibir o resultado final</li>
            </ul>

            <div className="space-y-2">
              {isGenerating && startTime && (
                <div className="text-center">
                  <span className="text-xs text-muted-foreground bg-gray-100 px-2 py-1 rounded-full">
                    ⏱️ {formatTime(elapsedTime)}
                  </span>
                </div>
              )}

              <Button
                onClick={generateTestBackground}
                disabled={isGenerating}
                className="w-full"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Gerando Fundo...
                  </>
                ) : (
                  "🎯 Gerar Fundo de Teste"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Logs em tempo real */}
        {result && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {result.success ? "✅" : "❌"}
                Resultado do Teste
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Informações do teste */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Time:</strong> {result.teamName}
                </div>
                <div>
                  <strong>Logo:</strong> {result.logoPath}
                </div>
                <div>
                  <strong>Background:</strong> {result.background}
                </div>
                <div>
                  <strong>Status:</strong>
                  <span
                    className={`ml-2 px-2 py-1 rounded text-xs ${
                      result.success
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {result.success ? "SUCESSO" : "ERRO"}
                  </span>
                </div>
              </div>

              {/* Logs detalhados */}
              <div>
                <h3 className="font-medium mb-2">📋 Logs Detalhados:</h3>
                <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                  <pre className="text-xs whitespace-pre-wrap font-mono">
                    {result.logs.join("\n")}
                  </pre>
                </div>
              </div>

              {/* Resultado final */}
              {result.success && result.urls && result.urls.length > 0 && (
                <div>
                  <h3 className="font-medium mb-2">🖼️ Background Gerado:</h3>
                  <div className="space-y-2">
                    {result.urls.map((url, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <p className="text-xs text-muted-foreground mb-2">
                          URL: {url}
                        </p>
                        <img
                          src={url}
                          alt={`Background gerado ${index + 1}`}
                          className="max-w-full h-auto max-h-64 mx-auto rounded-lg border cursor-pointer"
                          onClick={() => window.open(url, "_blank")}
                        />
                        <p className="text-xs text-center text-muted-foreground mt-2">
                          Clique na imagem para ver em tamanho completo
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Erro */}
              {!result.success && result.error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h3 className="font-medium text-red-800 mb-2">❌ Erro:</h3>
                  <p className="text-red-700">{result.error}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
