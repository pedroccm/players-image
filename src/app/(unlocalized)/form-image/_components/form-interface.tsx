"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { FormBackgroundSelector } from "./form-background-selector"
import { FormImageUpload } from "./form-image-upload"
import { TeamSelector } from "./team-selector"
import { getTeamNameById } from "@/lib/teams"

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
  const [generatedBackgrounds, setGeneratedBackgrounds] = useState<string[]>([])
  const [isGeneratingBackgrounds, setIsGeneratingBackgrounds] = useState(false)
  const [backgroundsError, setBackgroundsError] = useState<string | null>(null)
  const [useStaticBackgrounds, setUseStaticBackgrounds] = useState(true)

  const updateFormData = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handlePlayerImageUploaded = (imageUrl: string) => {
    updateFormData("playerImageUrl", imageUrl)
  }

  const handleBackgroundSelected = (backgroundUrl: string) => {
    updateFormData("selectedBackgroundUrl", backgroundUrl)
  }

  // Function to generate backgrounds for selected team
  const generateBackgroundsForTeam = async (teamId: string) => {
    setIsGeneratingBackgrounds(true)
    setBackgroundsError(null)
    setUseStaticBackgrounds(false)
    
    try {
      console.log("🏆 Generating backgrounds for team:", teamId)
      
      // Get team name from ID
      const teamName = getTeamNameById(teamId)
      console.log("📝 Team name for API:", teamName)
      
      const response = await fetch('/api/backgrounds/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamName })
      })
      
      const data = await response.json()
      console.log("📊 Background generation response:", data)
      
      if (data.success && data.urls && Array.isArray(data.urls)) {
        setGeneratedBackgrounds(data.urls)
        // Clear previous background selection
        updateFormData("selectedBackgroundUrl", "")
        toast.success(`${data.count} backgrounds gerados para ${teamName}!`)
      } else {
        throw new Error(data.error || "Erro ao gerar backgrounds")
      }
    } catch (error) {
      console.error("❌ Error generating backgrounds:", error)
      setBackgroundsError(error instanceof Error ? error.message : "Erro de conexão")
      setUseStaticBackgrounds(true) // Fallback to static backgrounds
      toast.error("Erro ao gerar backgrounds. Usando backgrounds padrão.")
    } finally {
      setIsGeneratingBackgrounds(false)
    }
  }

  // Auto-generate backgrounds when home team changes
  useEffect(() => {
    if (formData.homeTeam) {
      generateBackgroundsForTeam(formData.homeTeam)
    } else {
      // Reset to static backgrounds when no team selected
      setGeneratedBackgrounds([])
      setUseStaticBackgrounds(true)
      setBackgroundsError(null)
    }
  }, [formData.homeTeam])

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
                <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                  <Loader2 className="animate-spin mx-auto mb-2" size={24} />
                  <p className="text-sm text-muted-foreground">
                    Gerando backgrounds personalizados...
                  </p>
                </div>
              ) : backgroundsError ? (
                <div className="text-center py-8 border-2 border-dashed border-red-200 rounded-lg bg-red-50">
                  <p className="text-sm text-red-600 mb-2">{backgroundsError}</p>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => formData.homeTeam && generateBackgroundsForTeam(formData.homeTeam)}
                  >
                    Tentar Novamente
                  </Button>
                </div>
              ) : (
                <FormBackgroundSelector
                  backgrounds={useStaticBackgrounds ? BACKGROUND_OPTIONS : generatedBackgrounds}
                  onSelect={handleBackgroundSelected}
                  selectedBackground={formData.selectedBackgroundUrl}
                />
              )}
              {!useStaticBackgrounds && generatedBackgrounds.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  ✨ Backgrounds personalizados gerados para o seu time
                </p>
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
