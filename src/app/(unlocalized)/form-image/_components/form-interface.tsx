"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

import { getTeamNameById } from "@/lib/teams"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { FormBackgroundSelector } from "./form-background-selector"
import { FormImageUpload } from "./form-image-upload"
import { TeamSelector } from "./team-selector"

const BACKGROUND_OPTIONS = [
  "https://iynirubuonhsnxzzmrry.supabase.co/storage/v1/object/public/fotos/bg.png",
  "https://iynirubuonhsnxzzmrry.supabase.co/storage/v1/object/public/fotos/bg1.png",
  "https://iynirubuonhsnxzzmrry.supabase.co/storage/v1/object/public/fotos/bg2.png",
  "https://iynirubuonhsnxzzmrry.supabase.co/storage/v1/object/public/fotos/bg3.png",
  "https://iynirubuonhsnxzzmrry.supabase.co/storage/v1/object/public/fotos/bg4.png",
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

export function FormInterface() {
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
  const [existingBackgrounds, setExistingBackgrounds] = useState<string[]>([]) // Backgrounds já existentes
  const [newBackgrounds, setNewBackgrounds] = useState<string[]>([]) // Backgrounds recém gerados
  const [allKnownBackgrounds, setAllKnownBackgrounds] = useState<Set<string>>(
    new Set()
  ) // Track de todos
  const [isGeneratingBackgrounds, setIsGeneratingBackgrounds] = useState(false)
  const [backgroundsError, setBackgroundsError] = useState<string | null>(null)
  const [backgroundProgress, setBackgroundProgress] = useState({
    current: 0,
    total: 3,
  })
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const updateFormData = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handlePlayerImageUploaded = (imageUrl: string) => {
    updateFormData("playerImageUrl", imageUrl)
  }

  const handleBackgroundSelected = (backgroundUrl: string) => {
    updateFormData("selectedBackgroundUrl", backgroundUrl)
  }

  // Function to fetch existing backgrounds from Supabase
  const fetchBackgroundsFromSupabase = useCallback(async (teamName: string) => {
    try {
      const response = await fetch(
        `/api/backgrounds/list?teamName=${encodeURIComponent(teamName)}`
      )
      const data = await response.json()

      if (data.success && data.urls && Array.isArray(data.urls)) {
        console.log(
          `📊 Found ${data.urls.length} existing backgrounds for ${teamName}`
        )
        return data.urls
      } else {
        console.log(`📊 No existing backgrounds found for ${teamName}`)
        return []
      }
    } catch (error) {
      console.error("❌ Error fetching backgrounds from Supabase:", error)
      return []
    }
  }, [])

  // Function to trigger background generation (single call)
  const triggerBackgroundGeneration = useCallback(async (teamName: string) => {
    try {
      console.log(
        "🌐 Triggering background generation with count=3 for:",
        teamName
      )

      // Fire and forget - don't wait for response
      fetch("/api/backgrounds/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamName, count: 3 }),
      }).catch((error) => {
        console.error("❌ Background generation trigger failed:", error)
      })

      toast.success(`Gerando 3 backgrounds para ${teamName}...`)
    } catch (error) {
      console.error("❌ Error triggering background generation:", error)
    }
  }, [])

  // Function to generate a single new background
  const generateSingleBackground = useCallback(async () => {
    if (!formData.homeTeam || isGeneratingBackgrounds) return

    const teamName = getTeamNameById(formData.homeTeam)
    console.log("🎯 Generating single background for:", teamName)

    setIsGeneratingBackgrounds(true)
    setBackgroundsError(null)

    try {
      // Step 1: Trigger single generation (count=1)
      await fetch("/api/backgrounds/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamName, count: 1 }),
      }).catch((error) => {
        console.error("❌ Single background generation trigger failed:", error)
      })

      toast.success("Gerando 1 novo background...")

      // Step 2: Poll for the new background
      let pollCount = 0
      const maxPolls = 18 // 3 minutes at 10s intervals
      let foundNew = false

      const interval = setInterval(async () => {
        pollCount++
        console.log(`🔄 Single background poll ${pollCount}/${maxPolls}`)

        setBackgroundProgress({ current: pollCount, total: maxPolls })

        const latestBackgrounds = await fetchBackgroundsFromSupabase(teamName)
        // Para geração individual, verificar se não está nos existentes nem nos novos já conhecidos
        const newlyFound = latestBackgrounds.filter(
          (url) =>
            !existingBackgrounds.includes(url) && !newBackgrounds.includes(url)
        )

        if (newlyFound.length > 0) {
          // Found new background!
          const newUrl = newlyFound[0] // Take the first new one
          setNewBackgrounds((prev) => [...prev, newUrl])
          setAllKnownBackgrounds((prev) => new Set([...prev, newUrl]))

          foundNew = true
          clearInterval(interval)
          setIsGeneratingBackgrounds(false)

          console.log(`✅ Found new single background: ${newUrl}`)
          toast.success("🎉 Novo background gerado com sucesso!")
          return
        }

        // Stop condition: reached max polls
        if (pollCount >= maxPolls) {
          clearInterval(interval)
          setIsGeneratingBackgrounds(false)

          if (!foundNew) {
            setBackgroundsError(
              "Tempo limite atingido para gerar novo background."
            )
            toast.error("Tempo limite atingido. Tente novamente.")
          }
          return
        }
      }, 10000) // Poll every 10 seconds
    } catch (error) {
      console.error("❌ Error generating single background:", error)
      setIsGeneratingBackgrounds(false)
      toast.error("Erro ao gerar background. Tente novamente.")
    }
  }, [
    formData.homeTeam,
    isGeneratingBackgrounds,
    fetchBackgroundsFromSupabase,
    allKnownBackgrounds,
  ])

  // Function to start polling for new backgrounds
  const startPollingForBackgrounds = useCallback(
    async (teamId: string) => {
      // Clear any existing polling
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
        pollingIntervalRef.current = null
      }

      setIsGeneratingBackgrounds(true)
      setBackgroundsError(null)
      setNewBackgrounds([]) // Clear novos backgrounds

      const teamName = getTeamNameById(teamId)
      console.log("🏆 Starting background generation for team:", teamName)

      // Step 1: Load existing backgrounds immediately and fix them
      const initialBackgrounds = await fetchBackgroundsFromSupabase(teamName)
      setExistingBackgrounds(initialBackgrounds)
      setAllKnownBackgrounds(new Set(initialBackgrounds))

      const initialCount = initialBackgrounds.length
      console.log(`📊 Initial background count: ${initialCount}`)
      console.log(`📂 Initial existing backgrounds:`, initialBackgrounds)

      // Step 2: Trigger generation (fire and forget)
      await triggerBackgroundGeneration(teamName)

      // Step 3: Start polling for new backgrounds
      let pollCount = 0
      const maxPolls = 18 // 3 minutes at 10s intervals
      const targetNewBackgrounds = 3
      let foundNewCount = 0

      const interval = setInterval(async () => {
        pollCount++
        console.log(`🔄 Polling attempt ${pollCount}/${maxPolls}`)

        setBackgroundProgress({ current: pollCount, total: maxPolls })

        const latestBackgrounds = await fetchBackgroundsFromSupabase(teamName)

        // Filter apenas backgrounds novos (não existiam inicialmente)
        const newlyFound = latestBackgrounds.filter(
          (url) => !initialBackgrounds.includes(url)
        )

        console.log(`🔍 Debug polling - Team: ${teamName}`)
        console.log(`📊 Latest backgrounds found: ${latestBackgrounds.length}`)
        console.log(`📂 Initial backgrounds: ${initialBackgrounds.length}`)
        console.log(`🆕 Newly found: ${newlyFound.length}`)
        console.log(`🔢 Found new count: ${foundNewCount}`)
        console.log(`📋 Latest backgrounds:`, latestBackgrounds)
        console.log(`🆕 Newly found URLs:`, newlyFound)

        if (newlyFound.length > foundNewCount) {
          console.log(
            `➕ Found ${newlyFound.length} total new backgrounds:`,
            newlyFound
          )

          // Substituir completamente o array de novos backgrounds
          setNewBackgrounds(newlyFound)

          // Update conhecidos
          setAllKnownBackgrounds(
            new Set([...initialBackgrounds, ...newlyFound])
          )

          foundNewCount = newlyFound.length
          console.log(`✅ Updated! Total new backgrounds: ${foundNewCount}`)
        }

        // Stop conditions: found target new backgrounds OR reached max polls
        if (foundNewCount >= targetNewBackgrounds || pollCount >= maxPolls) {
          clearInterval(interval)
          pollingIntervalRef.current = null
          setIsGeneratingBackgrounds(false)

          if (foundNewCount >= targetNewBackgrounds) {
            toast.success(`🎉 ${foundNewCount} novos backgrounds gerados!`)
          } else if (foundNewCount > 0) {
            toast.success(
              `⏰ Tempo limite: ${foundNewCount} novos backgrounds encontrados.`
            )
          } else {
            setBackgroundsError(
              "Nenhum novo background foi gerado no tempo limite."
            )
            toast.error("Tempo limite atingido. Tente novamente.")
          }
          return
        }
      }, 10000) // Poll every 10 seconds

      pollingIntervalRef.current = interval
    },
    [fetchBackgroundsFromSupabase, triggerBackgroundGeneration]
  )

  // Auto-generate backgrounds when home team changes
  useEffect(() => {
    if (formData.homeTeam) {
      startPollingForBackgrounds(formData.homeTeam)
    } else {
      // Clear all backgrounds and stop polling when no team selected
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
        pollingIntervalRef.current = null
      }
      setExistingBackgrounds([])
      setNewBackgrounds([])
      setAllKnownBackgrounds(new Set())
      setBackgroundsError(null)
      setIsGeneratingBackgrounds(false)
    }
  }, [formData.homeTeam])

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
      }
    }
  }, [])

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

  return (
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
                onValueChange={(teamId) => updateFormData("homeTeam", teamId)}
                placeholder="Selecione seu time..."
              />
            </div>

            {/* Adversário */}
            <div className="space-y-2">
              <Label>Adversário *</Label>
              <TeamSelector
                value={formData.awayTeam}
                onValueChange={(teamId) => updateFormData("awayTeam", teamId)}
                placeholder="Selecione o adversário..."
              />
            </div>

            {/* Seleção de fundo */}
            <div className="space-y-2">
              <Label>Escolha o Fundo *</Label>
              {isGeneratingBackgrounds ? (
                <div className="space-y-4">
                  <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                    <Loader2 className="animate-spin mx-auto mb-2" size={24} />
                    <p className="text-sm text-muted-foreground">
                      Procurando novos backgrounds...
                    </p>
                    <div className="mt-2">
                      <p className="text-xs text-muted-foreground mb-2">
                        Procurando novos backgrounds (a cada 10s)
                      </p>
                      <div className="flex gap-1">
                        {Array.from({ length: backgroundProgress.total }).map(
                          (_, index) => (
                            <div
                              key={index}
                              className={`w-3 h-3 rounded-full border ${
                                index < backgroundProgress.current
                                  ? "bg-blue-500 border-blue-500"
                                  : "bg-gray-200 border-gray-300"
                              }`}
                            />
                          )
                        )}
                      </div>
                    </div>
                    {existingBackgrounds.length > 0 && (
                      <p className="text-xs text-blue-600 mt-1">
                        📂 {existingBackgrounds.length} backgrounds existentes
                      </p>
                    )}
                    {newBackgrounds.length > 0 && (
                      <p className="text-xs text-green-600 mt-1">
                        ✨ {newBackgrounds.length} novos backgrounds gerados
                      </p>
                    )}
                  </div>
                  <FormBackgroundSelector
                    backgrounds={(() => {
                      const allBgs = [
                        ...BACKGROUND_OPTIONS,
                        ...existingBackgrounds,
                        ...newBackgrounds,
                      ]
                      const uniqueBgs = allBgs.filter(
                        (url, index, array) => array.indexOf(url) === index
                      )
                      console.log(
                        "🎨 Rendering backgrounds - Total:",
                        allBgs.length,
                        "Unique:",
                        uniqueBgs.length
                      )
                      console.log(
                        "📂 Existing:",
                        existingBackgrounds.length,
                        "✨ New:",
                        newBackgrounds.length
                      )
                      return uniqueBgs
                    })()}
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
                      startPollingForBackgrounds(formData.homeTeam)
                    }
                  >
                    Tentar Novamente
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <FormBackgroundSelector
                    backgrounds={(() => {
                      const allBgs = [
                        ...BACKGROUND_OPTIONS,
                        ...existingBackgrounds,
                        ...newBackgrounds,
                      ]
                      const uniqueBgs = allBgs.filter(
                        (url, index, array) => array.indexOf(url) === index
                      )
                      console.log(
                        "🎨 Rendering backgrounds - Total:",
                        allBgs.length,
                        "Unique:",
                        uniqueBgs.length
                      )
                      console.log(
                        "📂 Existing:",
                        existingBackgrounds.length,
                        "✨ New:",
                        newBackgrounds.length
                      )
                      return uniqueBgs
                    })()}
                    onSelect={handleBackgroundSelected}
                    selectedBackground={formData.selectedBackgroundUrl}
                  />
                  <div className="flex flex-col gap-2">
                    {existingBackgrounds.length > 0 && (
                      <p className="text-xs text-blue-600">
                        📂 {existingBackgrounds.length} backgrounds existentes
                      </p>
                    )}
                    {newBackgrounds.length > 0 && (
                      <p className="text-xs text-green-600">
                        ✨ {newBackgrounds.length} novos backgrounds gerados
                      </p>
                    )}
                    {formData.homeTeam && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={generateSingleBackground}
                        disabled={isGeneratingBackgrounds}
                        className="w-fit"
                      >
                        {isGeneratingBackgrounds ? (
                          <>
                            <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                            Gerando...
                          </>
                        ) : (
                          "🎨 Gerar novo background"
                        )}
                      </Button>
                    )}
                  </div>
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
                onChange={(e) => updateFormData("gameLocation", e.target.value)}
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
                onChange={(e) => updateFormData("gameDateTime", e.target.value)}
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
                onChange={(e) => updateFormData("customPrompt", e.target.value)}
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
              Quer desbloquear recursos premium por apenas R$ 3,00? Você terá
              acesso a imagens sem marca d&apos;água e outras funcionalidades
              incríveis!
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
  )
}
