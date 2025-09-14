"use client"

import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

import { getTeamNameById } from "@/lib/teams"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"
import { FormBackgroundSelector } from "../form-image/_components/form-background-selector"
import { FormImageUpload } from "../form-image/_components/form-image-upload"
import { TeamSelector } from "../form-image/_components/team-selector"

const BACKGROUND_OPTIONS = [
  "https://iynirubuonhsnxzzmrry.supabase.co/storage/v1/object/public/fotos/bg.png",
  "https://iynirubuonhsnxzzmrry.supabase.co/storage/v1/object/public/fotos/bg1.png",
  "https://iynirubuonhsnxzzmrry.supabase.co/storage/v1/object/public/fotos/bg2.png",
  "https://iynirubuonhsnxzzmrry.supabase.co/storage/v1/object/public/fotos/bg3.png",
  "https://iynirubuonhsnxzzmrry.supabase.co/storage/v1/object/public/fotos/bg4.png",
  "https://wbsfhwnmteeshqmjnyor.supabase.co/storage/v1/object/public/athlete_media/saida.png",
  "https://wbsfhwnmteeshqmjnyor.supabase.co/storage/v1/object/public/athlete_media/spfc.jpg",
]

interface FormData {
  userName: string
  playerImageUrl: string
  selectedBackgroundUrl: string
  customPrompt: string
  gameLocation: string
  gameDateTime: string
  homeTeam: string
  awayTeam: string
}

export default function FormNewImagePage() {
  const [mounted, setMounted] = useState(false)
  const [formData, setFormData] = useState<FormData>({
    userName: "",
    playerImageUrl: "",
    selectedBackgroundUrl: "",
    customPrompt: "",
    gameLocation: "",
    gameDateTime: "",
    homeTeam: "",
    awayTeam: "",
  })

  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(
    null
  )
  const [showPaymentOffer, setShowPaymentOffer] = useState(false)
  const [hasPremium, setHasPremium] = useState(false)

  // Dynamic backgrounds states
  const [generatedBackgrounds, setGeneratedBackgrounds] = useState<string[]>([])
  const [isGeneratingBackgrounds, setIsGeneratingBackgrounds] = useState(false)
  const [backgroundsError, setBackgroundsError] = useState<string | null>(null)
  const [backgroundProgress, setBackgroundProgress] = useState({
    current: 0,
    total: 3,
    percentage: 0,
  })

  // Single background generation states
  const [isGeneratingSingleBg, setIsGeneratingSingleBg] = useState(false)
  const [singleBgProgress, setSingleBgProgress] = useState({
    percentage: 0,
  })

  // Evitar problemas de hidratação
  useEffect(() => {
    setMounted(true)
  }, [])

  const updateFormData = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handlePlayerImageUploaded = (imageUrl: string) => {
    updateFormData("playerImageUrl", imageUrl)
  }

  const handleBackgroundSelected = (backgroundUrl: string) => {
    updateFormData("selectedBackgroundUrl", backgroundUrl)
  }

  // Progress bar inteligente: completa quando API responde ou para em 98% após 40s
  const createSmartProgress = useCallback((current: number, total: number) => {
    let progress = 0
    let timer: NodeJS.Timeout
    const duration = 40000 // 40 segundos
    const interval = 100 // Atualiza a cada 100ms
    const maxProgressWithoutResponse = 98 // Para em 98% se API não responder

    const updateProgress = () => {
      progress += (interval / duration) * 100

      // Se passou 40s, para em 98% e aguarda API
      const finalProgress =
        progress >= 100 ? maxProgressWithoutResponse : progress

      setBackgroundProgress({
        current,
        total,
        percentage: Math.min(finalProgress, maxProgressWithoutResponse),
      })

      if (progress < 100) {
        timer = setTimeout(updateProgress, interval)
      }
    }

    // Iniciar progresso
    updateProgress()

    return {
      // Função para completar instantaneamente quando API responder
      complete: () => {
        if (timer) clearTimeout(timer)
        setBackgroundProgress({
          current,
          total,
          percentage: 100,
        })
      },
      // Função para limpar timer se necessário
      cleanup: () => {
        if (timer) clearTimeout(timer)
      },
    }
  }, [])

  // Função para gerar +1 background adicional
  const generateSingleBackground = useCallback(async () => {
    if (!formData.homeTeam) {
      toast.error("Selecione um time primeiro")
      return
    }

    setIsGeneratingSingleBg(true)
    setSingleBgProgress({ percentage: 0 })

    try {
      const teamName = getTeamNameById(formData.homeTeam)
      console.log("🔥 Gerando +1 background para:", teamName)

      // Criar progress bar customizado para background único
      let progress = 0
      let timer: NodeJS.Timeout
      const duration = 40000 // 40 segundos
      const interval = 100 // Atualiza a cada 100ms
      const maxProgressWithoutResponse = 98

      const updateProgress = () => {
        progress += (interval / duration) * 100
        const finalProgress =
          progress >= 100 ? maxProgressWithoutResponse : progress

        setSingleBgProgress({
          percentage: Math.min(finalProgress, maxProgressWithoutResponse),
        })

        if (progress < 100) {
          timer = setTimeout(updateProgress, interval)
        }
      }

      // Iniciar progresso
      updateProgress()

      const completeProgress = () => {
        if (timer) clearTimeout(timer)
        setSingleBgProgress({ percentage: 100 })
      }

      const cleanupProgress = () => {
        if (timer) clearTimeout(timer)
      }

      try {
        const response = await fetch("/api/backgrounds/generate-local", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ teamName, teamId: formData.homeTeam }),
        })

        const data = await response.json()

        if (data.success && data.urls && Array.isArray(data.urls)) {
          // Verificar se já existe antes de adicionar
          const newUrls = data.urls.filter(
            (url: string) => !generatedBackgrounds.includes(url)
          )

          if (newUrls.length > 0) {
            setGeneratedBackgrounds((prev) => [...prev, ...newUrls])
            toast.success(`+${newUrls.length} background adicionado!`)
          } else {
            toast.info("Background já existia - foi reutilizado!")
          }

          completeProgress()
          await new Promise((resolve) => setTimeout(resolve, 500))
        } else {
          throw new Error(data.error || "Erro ao gerar background")
        }
      } catch (error) {
        console.error("❌ Erro ao gerar background único:", error)
        toast.error("Erro ao gerar background adicional")

        completeProgress()
        await new Promise((resolve) => setTimeout(resolve, 500))
      } finally {
        cleanupProgress()
      }
    } catch (error) {
      console.error("❌ Erro geral:", error)
      toast.error("Erro ao processar solicitação")
    } finally {
      setIsGeneratingSingleBg(false)
      setSingleBgProgress({ percentage: 0 })
    }
  }, [formData.homeTeam, generatedBackgrounds])

  // Function to generate backgrounds for selected team using new local API
  const generateBackgroundsForTeam = useCallback(
    async (teamId: string) => {
      setIsGeneratingBackgrounds(true)
      setBackgroundsError(null)
      setGeneratedBackgrounds([]) // Clear previous generated backgrounds
      setBackgroundProgress({ current: 0, total: 3, percentage: 0 })

      try {
        console.log("🏆 Generating backgrounds for team:", teamId)

        // Get team name from ID
        const teamName = getTeamNameById(teamId)
        console.log("📝 Team name for API:", teamName)

        const maxBackgrounds = 3
        const allUrls: string[] = []

        // Make multiple calls to get multiple backgrounds progressively
        for (let i = 1; i <= maxBackgrounds; i++) {
          let progressController: {
            complete: () => void
            cleanup: () => void
          } | null = null

          try {
            console.log(`🌐 Making API call ${i}/${maxBackgrounds}...`)

            // Start smart progress bar
            progressController = createSmartProgress(i, maxBackgrounds)

            // Temporary: Use API route directly while debugging function
            const endpoint = "/api/backgrounds/generate-local"
            console.log(`🚀 Using endpoint: ${endpoint}`)

            const response = await fetch(endpoint, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ teamName, teamId }),
            })

            const data = await response.json()
            console.log(`📊 Background generation response ${i}:`, data)

            // API respondeu - completar progress bar instantaneamente
            progressController.complete()

            // Pequena pausa para mostrar 100% visualmente
            await new Promise((resolve) => setTimeout(resolve, 500))

            if (data.success && data.urls && Array.isArray(data.urls)) {
              allUrls.push(...data.urls)

              // Update backgrounds progressively as they arrive
              setGeneratedBackgrounds([...allUrls])

              console.log(
                `✅ Call ${i} successful, total backgrounds: ${allUrls.length}`
              )

              // Show success message for first background
              if (i === 1) {
                toast.success(`Backgrounds sendo gerados para ${teamName}!`)
              }
            } else {
              console.error(`❌ Call ${i} failed:`, data.error)
              // Mesmo com erro, completar progress bar
              if (progressController) {
                progressController.complete()
                await new Promise((resolve) => setTimeout(resolve, 500))
              }
            }
          } catch (error) {
            console.error(`❌ API call ${i} error:`, error)
            // Em caso de erro na API, completar progress bar
            if (progressController) {
              progressController.complete()
              await new Promise((resolve) => setTimeout(resolve, 500))
            }
          } finally {
            // Limpar timer se ainda estiver rodando
            if (progressController) {
              progressController.cleanup()
            }
          }
        }

        // Final status
        if (allUrls.length > 0) {
          toast.success(`${allUrls.length} backgrounds gerados com sucesso!`)
        } else {
          throw new Error("Todas as chamadas falharam")
        }
      } catch (error) {
        console.error("❌ Error generating backgrounds:", error)
        setBackgroundsError(
          error instanceof Error ? error.message : "Erro de conexão"
        )
        toast.error(
          "Erro ao gerar backgrounds personalizados. Backgrounds padrão disponíveis."
        )
      } finally {
        setIsGeneratingBackgrounds(false)
      }
    },
    [createSmartProgress]
  )

  // Auto-generate backgrounds when home team changes
  useEffect(() => {
    if (formData.homeTeam) {
      generateBackgroundsForTeam(formData.homeTeam)
    } else {
      // Clear generated backgrounds when no team selected
      setGeneratedBackgrounds([])
      setBackgroundsError(null)
    }
  }, [formData.homeTeam, generateBackgroundsForTeam])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validação
    if (!formData.userName.trim()) {
      toast.error("Nome é obrigatório")
      return
    }
    if (!formData.playerImageUrl) {
      toast.error("Foto do jogador é obrigatória")
      return
    }
    if (!formData.selectedBackgroundUrl) {
      toast.error("Seleção de fundo é obrigatória")
      return
    }
    if (!formData.gameLocation.trim()) {
      toast.error("Local do jogo é obrigatório")
      return
    }
    if (!formData.gameDateTime.trim()) {
      toast.error("Data/hora do jogo é obrigatória")
      return
    }
    if (!formData.homeTeam) {
      toast.error("Seu time é obrigatório")
      return
    }
    if (!formData.awayTeam) {
      toast.error("Adversário é obrigatório")
      return
    }

    setIsGenerating(true)

    try {
      const response = await fetch("/api/chat-image/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerImageUrl: formData.playerImageUrl,
          backgroundImageUrl: formData.selectedBackgroundUrl,
          customPrompt:
            formData.customPrompt ||
            "Combine the two images by cutting out the player photo (completely removing its background) and placing it on top of the background image, without blending, keeping the player sharp and clearly in the foreground.",
          userName: formData.userName,
          gameLocation: formData.gameLocation,
          gameDateTime: formData.gameDateTime,
          homeTeam: formData.homeTeam,
          awayTeam: formData.awayTeam,
          hasPremium,
        }),
      })

      const data = await response.json()

      if (data.success) {
        const imageUrl = `data:image/png;base64,${data.imageBase64}`
        setGeneratedImageUrl(imageUrl)
        toast.success("Imagem gerada com sucesso!")

        // Mostrar oferta de pagamento após 3 segundos
        setTimeout(() => {
          if (!hasPremium) {
            setShowPaymentOffer(true)
          }
        }, 3000)
      } else {
        if (data.error === "content_blocked") {
          toast.error("Essa foto não pôde ser processada. Tente outra foto.")
          setFormData((prev) => ({ ...prev, playerImageUrl: "" }))
        } else {
          throw new Error(data.message || data.error)
        }
      }
    } catch (error) {
      console.error("Error generating image:", error)

      const errorMessage =
        error instanceof Error ? error.message : "Erro desconhecido"
      if (errorMessage.includes("temporariamente sobrecarregado")) {
        toast.error(
          "Servidor temporariamente indisponível. Tente novamente em alguns minutos."
        )
      } else {
        toast.error("Erro ao gerar imagem. Tente novamente.")
      }
    } finally {
      setIsGenerating(false)
    }
  }

  const handlePaymentAccept = async () => {
    try {
      const response = await fetch("/api/abacatepay/create-qrcode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userName: formData.userName }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success("Pagamento PIX criado! Simule o pagamento para testar.")

        // Simular pagamento automaticamente (apenas para desenvolvimento)
        setTimeout(async () => {
          try {
            await fetch("/api/abacatepay/simulate-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ paymentId: data.data.id }),
            })

            setHasPremium(true)
            setShowPaymentOffer(false)
            toast.success("Premium ativado! Gerando imagem sem marca d'água...")

            // Regenerar imagem premium
            handleSubmit({ preventDefault: () => {} } as React.FormEvent)
          } catch (error) {
            console.error("Error simulating payment:", error)
          }
        }, 2000)
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error("Error creating payment:", error)
      toast.error("Erro ao criar pagamento")
    }
  }

  const isFormValid =
    formData.userName.trim() &&
    formData.playerImageUrl &&
    formData.selectedBackgroundUrl &&
    formData.gameLocation.trim() &&
    formData.gameDateTime.trim() &&
    formData.homeTeam &&
    formData.awayTeam

  // Evitar problemas de hidratação - só renderizar após mounted
  if (!mounted) {
    return (
      <div className="min-h-screen bg-background">
        <div className="bg-primary/10 border-b px-6 py-4">
          <h1 className="text-xl font-semibold">
            Player.CX - Formulário Nova API V4
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-primary/10 border-b px-6 py-4">
        <h1 className="text-xl font-semibold">
          Player.CX - Formulário Nova API V4
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Progress inteligente + Backgrounds únicos + Botão &quot;+1
          Background&quot;
        </p>
      </div>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Crie sua Imagem Personalizada</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Nome */}
                <div className="space-y-2">
                  <Label htmlFor="userName">Nome *</Label>
                  <Input
                    id="userName"
                    value={formData.userName}
                    onChange={(e) => updateFormData("userName", e.target.value)}
                    placeholder="Digite seu nome..."
                    required
                  />
                </div>

                {/* Seu Time */}
                <div className="space-y-2">
                  <Label>Seu Time *</Label>
                  <TeamSelector
                    value={formData.homeTeam}
                    onValueChange={(teamId) =>
                      updateFormData("homeTeam", teamId)
                    }
                    placeholder="Selecione seu time..."
                  />
                </div>

                {/* Adversário */}
                <div className="space-y-2">
                  <Label>Adversário *</Label>
                  <TeamSelector
                    value={formData.awayTeam}
                    onValueChange={(teamId) =>
                      updateFormData("awayTeam", teamId)
                    }
                    placeholder="Selecione o adversário..."
                  />
                </div>

                {/* Seleção de fundo */}
                <div className="space-y-2">
                  <Label>Escolha o Fundo *</Label>
                  {isGeneratingBackgrounds ? (
                    <div className="space-y-4">
                      <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                        <Loader2
                          className="animate-spin mx-auto mb-2"
                          size={24}
                        />
                        <p className="text-sm text-muted-foreground">
                          Gerando backgrounds personalizados...
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Background: {backgroundProgress.current}/
                          {backgroundProgress.total}
                        </p>
                        <div className="max-w-xs mx-auto mt-3">
                          <Progress
                            value={backgroundProgress.percentage}
                            className="h-2"
                          />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {Math.round(backgroundProgress.percentage)}% completo
                        </p>
                      </div>
                      <FormBackgroundSelector
                        backgrounds={[
                          ...BACKGROUND_OPTIONS,
                          ...generatedBackgrounds,
                        ]}
                        onSelect={handleBackgroundSelected}
                        selectedBackground={formData.selectedBackgroundUrl}
                      />
                    </div>
                  ) : backgroundsError ? (
                    <div className="text-center py-8 border-2 border-dashed border-red-200 rounded-lg bg-red-50">
                      <p className="text-sm text-red-600 mb-2">
                        {backgroundsError}
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          formData.homeTeam &&
                          generateBackgroundsForTeam(formData.homeTeam)
                        }
                      >
                        Tentar Novamente
                      </Button>
                    </div>
                  ) : (
                    <FormBackgroundSelector
                      backgrounds={[
                        ...BACKGROUND_OPTIONS,
                        ...generatedBackgrounds,
                      ]}
                      onSelect={handleBackgroundSelected}
                      selectedBackground={formData.selectedBackgroundUrl}
                    />
                  )}
                  {generatedBackgrounds.length > 0 && (
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">
                        ✨ {generatedBackgrounds.length} backgrounds
                        personalizados adicionados
                      </p>

                      {formData.homeTeam && (
                        <div className="flex items-center gap-2">
                          {isGeneratingSingleBg && (
                            <div className="flex items-center gap-1">
                              <div className="w-12 bg-gray-200 rounded-full h-1.5">
                                <div
                                  className="bg-blue-600 h-1.5 rounded-full transition-all"
                                  style={{
                                    width: `${singleBgProgress.percentage}%`,
                                  }}
                                ></div>
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {Math.round(singleBgProgress.percentage)}%
                              </span>
                            </div>
                          )}

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={generateSingleBackground}
                            disabled={
                              isGeneratingSingleBg || isGeneratingBackgrounds
                            }
                            className="text-xs"
                          >
                            {isGeneratingSingleBg ? (
                              <>
                                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                                Gerando...
                              </>
                            ) : (
                              "🎲 +1 Background"
                            )}
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Upload da foto */}
                <div className="space-y-2">
                  <Label>Sua Foto *</Label>
                  <FormImageUpload
                    label="Foto do Jogador"
                    onImageUploaded={handlePlayerImageUploaded}
                    currentImageUrl={formData.playerImageUrl}
                  />
                </div>

                {/* Local do jogo */}
                <div className="space-y-2">
                  <Label htmlFor="gameLocation">Local do Jogo *</Label>
                  <Input
                    id="gameLocation"
                    value={formData.gameLocation}
                    onChange={(e) =>
                      updateFormData("gameLocation", e.target.value)
                    }
                    placeholder="Ex: Estádio Morumbi"
                    required
                  />
                </div>

                {/* Data/hora do jogo */}
                <div className="space-y-2">
                  <Label htmlFor="gameDateTime">Data e Horário do Jogo *</Label>
                  <Input
                    id="gameDateTime"
                    value={formData.gameDateTime}
                    onChange={(e) =>
                      updateFormData("gameDateTime", e.target.value)
                    }
                    placeholder="Ex: 15/12/2024 - 16:00"
                    required
                  />
                </div>

                {/* Prompt personalizado */}
                <div className="space-y-2">
                  <Label htmlFor="customPrompt">
                    Como Combinar as Imagens (opcional)
                  </Label>
                  <Textarea
                    id="customPrompt"
                    value={formData.customPrompt}
                    onChange={(e) =>
                      updateFormData("customPrompt", e.target.value)
                    }
                    placeholder="Ex: remova o fundo e coloque o jogador em destaque, misture as duas imagens..."
                    rows={3}
                  />
                </div>

                {/* Botão de submit */}
                <Button
                  type="submit"
                  className="w-full"
                  disabled={!isFormValid || isGenerating}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Gerando Imagem...
                    </>
                  ) : (
                    "Gerar Imagem"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Imagem gerada */}
          {generatedImageUrl && (
            <Card>
              <CardHeader>
                <CardTitle>Sua Imagem Personalizada</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <img
                    src={generatedImageUrl}
                    alt="Imagem gerada"
                    className="max-w-full h-auto mx-auto rounded-lg cursor-pointer border"
                    onClick={() => window.open(generatedImageUrl, "_blank")}
                  />
                  <p className="text-sm text-muted-foreground mt-2">
                    Clique na imagem para ver em tamanho completo
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Oferta de pagamento */}
          {showPaymentOffer && !hasPremium && (
            <Card className="border-yellow-200 bg-yellow-50">
              <CardHeader>
                <CardTitle className="text-yellow-800">
                  💎 Upgrade Premium
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-yellow-700 mb-4">
                  Quer desbloquear recursos premium por apenas R$ 3,00? Você
                  terá acesso a imagens sem marca d&apos;água e outras
                  funcionalidades incríveis!
                </p>
                <div className="flex gap-3">
                  <Button
                    onClick={handlePaymentAccept}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    💳 Sim, quero premium!
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowPaymentOffer(false)}
                  >
                    Não, obrigado
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {hasPremium && (
            <Card className="border-green-200 bg-green-50">
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-green-800 font-medium">
                    🎉 Parabéns! Você tem acesso premium ativo!
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
