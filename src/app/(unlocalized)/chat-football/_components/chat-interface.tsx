"use client"

import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"

import { getTeamNameById } from "@/lib/teams"

import { BackgroundGallery } from "./background-gallery"
import { ChatMessage } from "./chat-message"
import { PaymentModal } from "./payment-modal"
import { PhotoUpload } from "./photo-upload"
import { PreviewPremium } from "./preview-premium"
import { TeamSelector } from "./team-selector"

interface Message {
  id: string
  type: "bot" | "user"
  content: string
  timestamp: Date
  imageUrl?: string
}

interface ChatFormData {
  userName: string
  playerImageUrl: string
  selectedBackgroundUrl: string
  gameLocation: string
  gameDateTime: string
  homeTeam: string
  awayTeam: string
}

type ChatStep =
  | "welcome"
  | "name"
  | "homeTeam"
  | "awayTeam"
  | "background"
  | "photo"
  | "location"
  | "datetime"
  | "generating"
  | "preview"
  | "premium"
  | "complete"

const BACKGROUND_OPTIONS = [
  "https://iynirubuonhsnxzzmrry.supabase.co/storage/v1/object/public/fotos/bg.png",
  "https://iynirubuonhsnxzzmrry.supabase.co/storage/v1/object/public/fotos/bg1.png",
  "https://iynirubuonhsnxzzmrry.supabase.co/storage/v1/object/public/fotos/bg2.png",
  "https://iynirubuonhsnxzzmrry.supabase.co/storage/v1/object/public/fotos/bg3.png",
  "https://iynirubuonhsnxzzmrry.supabase.co/storage/v1/object/public/fotos/bg4.png",
]

export function ChatInterface() {
  const [mounted, setMounted] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [currentStep, setCurrentStep] = useState<ChatStep>("welcome")
  const [isTyping, setIsTyping] = useState(false)
  const [userInput, setUserInput] = useState("")

  const [formData, setFormData] = useState<ChatFormData>({
    userName: "",
    playerImageUrl: "",
    selectedBackgroundUrl: "",
    gameLocation: "",
    gameDateTime: "",
    homeTeam: "",
    awayTeam: "",
  })

  const [_isGenerating, setIsGenerating] = useState(false)
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(
    null
  )
  const [generatedBackgrounds, setGeneratedBackgrounds] = useState<string[]>([])
  const [isGeneratingBackgrounds, setIsGeneratingBackgrounds] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted && messages.length === 0) {
      addMessage("bot", "Olá! Qual o seu nome?")
      setCurrentStep("name")
    }
  }, [mounted])

  const addMessage = useCallback(
    (type: "bot" | "user", content: string, imageUrl?: string) => {
      const newMessage: Message = {
        id: Math.random().toString(36).substr(2, 9),
        type,
        content,
        timestamp: new Date(),
        imageUrl,
      }
      setMessages((prev) => [...prev, newMessage])
    },
    []
  )

  const addBotMessage = useCallback(
    async (content: string, delay = 800) => {
      setIsTyping(true)
      await new Promise((resolve) => setTimeout(resolve, delay))
      addMessage("bot", content)
      setIsTyping(false)
    },
    [addMessage]
  )

  const handleNameSubmit = async () => {
    if (!userInput.trim()) return

    const name = userInput.trim()
    addMessage("user", name)
    setFormData((prev) => ({ ...prev, userName: name }))
    setUserInput("")

    await addBotMessage(`Oi ${name}! Agora me fala, qual é o seu time?`)
    setCurrentStep("homeTeam")
  }

  const handleHomeTeamSelect = async (teamId: string) => {
    const teamName = getTeamNameById(teamId)
    addMessage("user", teamName)
    setFormData((prev) => ({ ...prev, homeTeam: teamId }))

    await addBotMessage(`${teamName}! E qual é o time adversário?`)
    setCurrentStep("awayTeam")
  }

  const handleAwayTeamSelect = async (teamId: string) => {
    const teamName = getTeamNameById(teamId)
    addMessage("user", teamName)
    setFormData((prev) => ({ ...prev, awayTeam: teamId }))

    await addBotMessage("Irado! Agora escolha o fundo para sua arte:")
    setCurrentStep("background")
  }

  const handleBackgroundSelect = async (backgroundUrl: string) => {
    addMessage("user", "Fundo selecionado ✅", backgroundUrl)
    setFormData((prev) => ({ ...prev, selectedBackgroundUrl: backgroundUrl }))

    await addBotMessage("Perfeito! Agora adicione sua foto:")
    setCurrentStep("photo")
  }

  const handlePhotoUpload = async (imageUrl: string) => {
    addMessage("user", "Foto enviada ✅", imageUrl)
    setFormData((prev) => ({ ...prev, playerImageUrl: imageUrl }))

    await addBotMessage("Ficou ótima! Agora me diga o local do jogo:")
    setCurrentStep("location")
  }

  const handleLocationSubmit = async () => {
    if (!userInput.trim()) return

    const location = userInput.trim()
    addMessage("user", location)
    setFormData((prev) => ({ ...prev, gameLocation: location }))
    setUserInput("")

    await addBotMessage(`${location}! E a data e hora do jogo?`)
    setCurrentStep("datetime")
  }

  const handleDateTimeSubmit = async () => {
    if (!userInput.trim()) return

    const datetime = userInput.trim()
    addMessage("user", datetime)
    setFormData((prev) => ({ ...prev, gameDateTime: datetime }))
    setUserInput("")

    await addBotMessage("Gerando sua arte personalizada...")
    setCurrentStep("generating")
    await generateImage()
  }

  const generateImage = async () => {
    setIsGenerating(true)

    try {
      // Debug: log the URLs being sent
      console.log("Generating image with:", {
        playerImageUrl: formData.playerImageUrl,
        backgroundImageUrl: formData.selectedBackgroundUrl,
        userName: formData.userName,
        gameLocation: formData.gameLocation,
        gameDateTime: formData.gameDateTime,
        homeTeam: formData.homeTeam,
        awayTeam: formData.awayTeam,
      })

      const response = await fetch("/api/chat-image/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerImageUrl: formData.playerImageUrl,
          backgroundImageUrl: formData.selectedBackgroundUrl,
          customPrompt:
            "Combine the two images by cutting out the player photo (completely removing its background) and placing it on top of the background image, without blending, keeping the player sharp and clearly in the foreground.",
          userName: formData.userName,
          gameLocation: formData.gameLocation,
          gameDateTime: formData.gameDateTime,
          homeTeam: formData.homeTeam,
          awayTeam: formData.awayTeam,
          hasPremium: false,
        }),
      })

      const data = await response.json()

      if (data.success) {
        const imageUrl = `data:image/png;base64,${data.imageBase64}`
        setGeneratedImageUrl(imageUrl)
        setCurrentStep("preview")
      } else {
        throw new Error(data.message || data.error)
      }
    } catch (error) {
      console.error("Error generating image:", error)
      await addBotMessage(
        "Ops! Houve um erro ao gerar a imagem. Tente novamente."
      )
      toast.error("Erro ao gerar imagem")
      setCurrentStep("datetime")
    } finally {
      setIsGenerating(false)
    }
  }

  const handleGenerateBackgrounds = async () => {
    if (!formData.homeTeam) {
      toast.error("Selecione um time primeiro")
      return
    }

    setIsGeneratingBackgrounds(true)
    await addBotMessage("Gerando novos fundos personalizados...")

    try {
      const teamName = getTeamNameById(formData.homeTeam)
      console.log("🔥 Gerando 4 backgrounds para:", teamName)

      const maxBackgrounds = 4
      const newUrls: string[] = []

      // Generate 4 backgrounds sequentially using generate-local
      for (let i = 1; i <= maxBackgrounds; i++) {
        try {
          console.log(`🌐 Gerando background ${i}/${maxBackgrounds}...`)

          const response = await fetch("/api/backgrounds/generate-local", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              teamName,
              teamId: formData.homeTeam,
            }),
          })

          const data = await response.json()
          console.log(`📊 Background ${i} response:`, data)

          if (data.success && data.urls && Array.isArray(data.urls)) {
            // Filter duplicates
            const filteredUrls = data.urls.filter(
              (url: string) =>
                !generatedBackgrounds.includes(url) && !newUrls.includes(url)
            )

            if (filteredUrls.length > 0) {
              newUrls.push(...filteredUrls)
              // Update progressively
              setGeneratedBackgrounds((prev) => [...prev, ...filteredUrls])
              console.log(
                `✅ Background ${i} adicionado, total: ${newUrls.length}`
              )
            } else {
              console.log(`ℹ️ Background ${i} já existia (reutilizado)`)
            }
          } else {
            console.error(`❌ Background ${i} failed:`, data.error)
          }
        } catch (error) {
          console.error(`❌ Error generating background ${i}:`, error)
        }
      }

      if (newUrls.length > 0) {
        await addBotMessage(`✅ ${newUrls.length} novos fundos gerados!`)
        toast.success(`${newUrls.length} fundos adicionados!`)
      } else {
        await addBotMessage("ℹ️ Todos os fundos já foram reutilizados!")
        toast.info("Backgrounds já existiam - foram reutilizados!")
      }
    } catch (error) {
      console.error("❌ Error generating backgrounds:", error)
      toast.error("Erro ao gerar fundos")
      await addBotMessage("Ops! Erro ao gerar fundos. Tente novamente.")
    } finally {
      setIsGeneratingBackgrounds(false)
    }
  }

  const handlePremiumAccept = () => {
    setShowPaymentModal(true)
  }

  const handlePremiumDecline = async () => {
    await addBotMessage("Tudo bem! Quer criar outra arte?")
    setCurrentStep("complete")
  }

  const handlePaymentCompleted = async () => {
    setShowPaymentModal(false)
    await addBotMessage(
      "🎉 Pagamento confirmado! Gerando sua versão premium..."
    )
    // Aqui você pode adicionar lógica para gerar a versão premium
    toast.success("Versão premium desbloqueada!")
    setCurrentStep("complete")
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      if (currentStep === "name") {
        handleNameSubmit()
      } else if (currentStep === "location") {
        handleLocationSubmit()
      } else if (currentStep === "datetime") {
        handleDateTimeSubmit()
      }
    }
  }

  if (!mounted) {
    return null
  }

  const showInput = ["name", "location", "datetime"].includes(currentStep)

  return (
    <div>
      {/* Heading Text */}
      <div className="heading-text">
        <p className="title">
          <img className="emoji" src="/football/images/wave.png" alt="wave" />{" "}
          Bem-vindo ao Players MatchDay!
        </p>
        <p className="subtitle">
          Aqui você pode gerar artes personalizadas do seu jogo ou só uma foto
          estilizada pra bombar no Insta.
        </p>
        <p className="heading-question">
          Bora criar a sua?{" "}
          <img
            className="emoji"
            src="/football/images/rocket.png"
            alt="rocket"
          />
        </p>
      </div>

      {/* Questions & Answers (Chat Messages) */}
      <div className="questions-answers">
        {messages.map((message) => (
          <ChatMessage key={message.id} message={message} />
        ))}

        {isTyping && (
          <div className="q-and-a">
            <div className="question-content">
              <img
                className="logo-circle"
                src="/football/images/logo_circle.png"
                alt="logo"
              />
              <div className="question-data">
                <p className="question">digitando...</p>
              </div>
            </div>
          </div>
        )}

        {/* Team Selector - Home */}
        {currentStep === "homeTeam" && !isTyping && (
          <TeamSelector onSelect={handleHomeTeamSelect} />
        )}

        {/* Team Selector - Away */}
        {currentStep === "awayTeam" && !isTyping && (
          <TeamSelector onSelect={handleAwayTeamSelect} />
        )}

        {/* Background Gallery */}
        {currentStep === "background" && !isTyping && (
          <BackgroundGallery
            backgrounds={[...BACKGROUND_OPTIONS, ...generatedBackgrounds]}
            onSelect={handleBackgroundSelect}
            onGenerateMore={handleGenerateBackgrounds}
            isGenerating={isGeneratingBackgrounds}
          />
        )}

        {/* Photo Upload */}
        {currentStep === "photo" && !isTyping && (
          <PhotoUpload onUpload={handlePhotoUpload} />
        )}

        {/* Preview & Premium */}
        {currentStep === "preview" && generatedImageUrl && (
          <PreviewPremium
            imageUrl={generatedImageUrl}
            onAccept={handlePremiumAccept}
            onDecline={handlePremiumDecline}
          />
        )}
      </div>

      {/* Input Area */}
      {showInput && !isTyping && (
        <div className="q-and-a">
          <div className="input-container">
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={
                currentStep === "name"
                  ? "Digite seu nome..."
                  : currentStep === "location"
                    ? "Ex: Estádio Morumbi"
                    : "Ex: 15/12/2024 - 16:00"
              }
            />
          </div>
        </div>
      )}

      {/* Footer */}
      {(currentStep === "name" ||
        currentStep === "location" ||
        currentStep === "datetime") &&
        !isTyping && (
          <footer className="footer-page center-flex">
            <button
              className="footer-btn center-flex"
              onClick={() => {
                if (currentStep === "name") handleNameSubmit()
                else if (currentStep === "location") handleLocationSubmit()
                else if (currentStep === "datetime") handleDateTimeSubmit()
              }}
              disabled={!userInput.trim()}
            >
              Enviar
              <svg
                className="arrow-right"
                version="1.1"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 640 640"
              >
                <path d="M517.504 288l-194.272-194.272 45.248-45.248 271.52 271.52-271.52 271.52-45.248-45.248 194.272-194.272h-517.504v-64z"></path>
              </svg>
            </button>
          </footer>
        )}

      {/* Generating State */}
      {currentStep === "generating" && (
        <footer className="footer-page center-flex">
          <div className="loader center-flex">
            <img
              className="sand-clock"
              src="/football/images/sand_clock.png"
              alt="loading"
            />
            Gerando imagem... aguarde só um pouquinho.
          </div>
        </footer>
      )}

      {/* Payment Modal */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onPaymentCompleted={handlePaymentCompleted}
        userName={formData.userName}
      />
    </div>
  )
}
