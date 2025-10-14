"use client"

import { useCallback, useEffect, useRef, useState } from "react"

import { getTeamNameById } from "@/lib/teams"

import { BackgroundGallery } from "./background-gallery"
import { ChatMessage } from "./chat-message"
import { PhotoUpload } from "./photo-upload"
import { PreviewPremium } from "./preview-premium"
import { TeamSelector } from "./team-selector"

interface Message {
  id: string
  type: "bot" | "user"
  content: string
  timestamp: Date
  imageUrl?: string
  pixData?: {
    qrCodeImage: string
    brCode: string
    amount: number
    paymentId: string
  }
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
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

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
  const [generatedPremiumImageUrl, setGeneratedPremiumImageUrl] = useState<
    string | null
  >(null)
  const [generatedBackgrounds, setGeneratedBackgrounds] = useState<string[]>([])
  const [isGeneratingBackgrounds, setIsGeneratingBackgrounds] = useState(false)
  const [backgroundGenerationCount, setBackgroundGenerationCount] = useState(0)
  const [generationProgress, setGenerationProgress] = useState(0)
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted && messages.length === 0) {
      addMessage("bot", "Olá! Qual o seu nome?")
      setCurrentStep("name")
    }
  }, [mounted])

  // Auto-scroll quando mensagens mudam ou currentStep muda
  useEffect(() => {
    const scrollToBottom = () => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }

    // Pequeno delay para garantir que o conteúdo foi renderizado
    const timer = setTimeout(scrollToBottom, 100)
    return () => clearTimeout(timer)
  }, [messages, currentStep, isTyping])

  // Limpar progress interval quando componente desmonta
  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current)
      }
    }
  }, [])

  // Auto-focus no input quando o step muda
  useEffect(() => {
    const shouldShowInput = ["name", "location", "datetime"].includes(
      currentStep
    )
    if (shouldShowInput && !isTyping && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
    }
  }, [currentStep, isTyping])

  const startFakeProgress = () => {
    setGenerationProgress(0)
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current)
    }

    // Incrementa ~0.5% a cada 300ms = 100% em 60 segundos
    progressIntervalRef.current = setInterval(() => {
      setGenerationProgress((prev) => {
        if (prev >= 95) return prev // Para em 95% até API retornar
        return prev + 0.5
      })
    }, 300)
  }

  const completeFakeProgress = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current)
      progressIntervalRef.current = null
    }
    setGenerationProgress(100)

    // Reset progress após 2 segundos
    setTimeout(() => {
      setGenerationProgress(0)
    }, 2000)
  }

  const addMessage = useCallback(
    (
      type: "bot" | "user",
      content: string,
      imageUrl?: string,
      pixData?: {
        qrCodeImage: string
        brCode: string
        amount: number
        paymentId: string
      }
    ) => {
      const newMessage: Message = {
        id: Math.random().toString(36).substr(2, 9),
        type,
        content,
        timestamp: new Date(),
        imageUrl,
        pixData,
      }
      setMessages((prev) => [...prev, newMessage])
      return newMessage.id
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
    await generateImage(datetime)
  }

  const generateImage = async (overrideDateTime?: string) => {
    setIsGenerating(true)

    try {
      // Debug: log the URLs being sent
      console.log("Generating image with:", {
        playerImageUrl: formData.playerImageUrl,
        backgroundImageUrl: formData.selectedBackgroundUrl,
        userName: formData.userName,
        gameLocation: formData.gameLocation,
        gameDateTime: overrideDateTime || formData.gameDateTime,
        homeTeam: formData.homeTeam,
        awayTeam: formData.awayTeam,
      })

      // Gerar UMA ÚNICA vez - backend cria ambas as versões
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
          gameDateTime: overrideDateTime || formData.gameDateTime,
          homeTeam: formData.homeTeam,
          awayTeam: formData.awayTeam,
          generateBothVersions: true, // Backend gera ambas as versões
        }),
      })

      const data = await response.json()

      if (data.success) {
        const imageUrl = `data:image/png;base64,${data.imageBase64}` // com marca d'água
        const premiumImageUrl = data.premiumImageBase64
          ? `data:image/png;base64,${data.premiumImageBase64}` // sem marca d'água
          : null

        setGeneratedImageUrl(imageUrl)
        setGeneratedPremiumImageUrl(premiumImageUrl)

        // Mostrar a arte com marca d'água como mensagem no chat
        addMessage("bot", "Aqui está sua arte! 🎨", imageUrl)

        setCurrentStep("preview")
      } else {
        throw new Error(data.message || data.error)
      }
    } catch (error) {
      console.error("Error generating image:", error)
      await addBotMessage(
        "Ops! Houve um erro ao gerar a imagem. Tente novamente."
      )
      setCurrentStep("datetime")
    } finally {
      setIsGenerating(false)
    }
  }

  const handleGenerateBackgrounds = async () => {
    if (!formData.homeTeam) {
      return
    }

    // Limite máximo de 5 gerações
    if (backgroundGenerationCount >= 5) {
      addMessage(
        "bot",
        "Você já atingiu o limite de 5 backgrounds personalizados! Escolha um dos disponíveis."
      )
      return
    }

    setIsGeneratingBackgrounds(true)
    startFakeProgress() // Iniciar fake progress bar

    try {
      const teamName = getTeamNameById(formData.homeTeam)
      console.log("🔥 Gerando 1 background para:", teamName)

      const response = await fetch("/api/backgrounds/generate-local", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamName,
          teamId: formData.homeTeam,
        }),
      })

      const data = await response.json()
      console.log("📊 Background response:", data)

      if (data.success && data.urls && Array.isArray(data.urls)) {
        // Filter duplicates
        const filteredUrls = data.urls.filter(
          (url: string) => !generatedBackgrounds.includes(url)
        )

        if (filteredUrls.length > 0) {
          completeFakeProgress() // Completar progress bar
          setGeneratedBackgrounds((prev) => [...prev, ...filteredUrls])
          setBackgroundGenerationCount((prev) => prev + 1)

          const remaining = 5 - (backgroundGenerationCount + 1)
          addMessage("bot", "✅ Novo fundo gerado com sucesso!")

          // Perguntar se quer gerar mais (se não atingiu o limite)
          if (remaining > 0) {
            // Pequeno delay para separar as mensagens
            setTimeout(() => {
              addMessage(
                "bot",
                `Quer gerar mais um fundo? (você pode gerar mais ${remaining})`
              )
            }, 500)
          } else {
            setTimeout(() => {
              addMessage(
                "bot",
                "Você atingiu o limite de 5 backgrounds personalizados! Escolha um dos disponíveis."
              )
            }, 500)
          }

          console.log(`✅ Background adicionado, total: ${remaining} restantes`)
        } else {
          completeFakeProgress() // Completar progress bar se duplicado
          addMessage("bot", "ℹ️ Esse fundo já foi gerado! Gerando outro...")
          // Tentar gerar novamente automaticamente
          setIsGeneratingBackgrounds(false)
          setTimeout(() => handleGenerateBackgrounds(), 1000)
          return
        }
      } else {
        throw new Error(data.error || "Erro ao gerar background")
      }
    } catch (error) {
      completeFakeProgress() // Completar progress bar em caso de erro
      console.error("❌ Error generating background:", error)
      addMessage("bot", "Ops! Erro ao gerar fundo. Tente novamente.")
    } finally {
      setIsGeneratingBackgrounds(false)
    }
  }

  const handlePremiumAccept = async () => {
    addMessage("user", "💳 Sim, quero premium!")

    await addBotMessage("Perfeito! Criando seu pagamento PIX...")

    try {
      const response = await fetch("/api/abacatepay/create-qrcode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userName: formData.userName }),
      })

      const data = await response.json()

      if (data.success) {
        // Adicionar mensagem com dados PIX
        addMessage("bot", "Aqui está seu pagamento PIX:", undefined, {
          qrCodeImage: data.data.brCodeBase64,
          brCode: data.data.brCode,
          amount: data.data.amount,
          paymentId: data.data.id,
        })

        // Mudar para estado de aguardando pagamento
        setCurrentStep("premium")
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error("Error creating payment:", error)
      await addBotMessage(
        "Ops! Houve um erro ao criar o pagamento. Tente novamente."
      )
    }
  }

  const handlePremiumDecline = async () => {
    addMessage("user", "Não, obrigado")
    await addBotMessage(
      "Tudo bem! Para criar uma nova arte, basta recarregar a página.",
      800
    )
    await addBotMessage("Não esqueça de salvar sua foto!", 1200)
    setCurrentStep("complete")
  }

  const handleSimulatePayment = async (paymentId: string) => {
    try {
      await addBotMessage("Simulando pagamento...")

      const response = await fetch("/api/abacatepay/simulate-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId }),
      })

      const data = await response.json()

      if (data.success) {
        await addBotMessage("✅ Pagamento simulado com sucesso!")
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error("Error simulating payment:", error)
      await addBotMessage("❌ Erro ao simular pagamento. Tente novamente.")
    }
  }

  const handleCheckPayment = async (paymentId: string) => {
    try {
      await addBotMessage("Verificando pagamento...")

      const response = await fetch(
        `/api/abacatepay/check-payment?id=${paymentId}`
      )
      const data = await response.json()

      if (data.success) {
        if (data.data.status === "PAID") {
          await handlePaymentCompleted()
        } else {
          await addBotMessage(
            `❌ Pagamento ainda não confirmado. Status: ${data.data.status}`
          )
        }
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error("Error checking payment:", error)
      await addBotMessage("❌ Erro ao verificar pagamento. Tente novamente.")
    }
  }

  const handlePaymentCompleted = async () => {
    await addBotMessage("🎉 Arte premium liberada!", 1000)

    // Usar a versão premium que já foi gerada anteriormente
    if (generatedPremiumImageUrl) {
      // Update state with premium image
      setGeneratedImageUrl(generatedPremiumImageUrl)

      // Show the premium image without watermark
      addMessage(
        "bot",
        "Sua imagem premium em alta resolução:",
        generatedPremiumImageUrl
      )

      await addBotMessage(
        "Para criar uma nova arte, basta recarregar a página.",
        1500
      )
      await addBotMessage("Não esqueça de salvar sua foto!", 2000)

      setCurrentStep("complete")
    } else {
      // Fallback: se por algum motivo não tiver a versão premium salva
      await addBotMessage(
        "❌ Erro ao carregar imagem premium. Mostrando a versão com marca d'água."
      )

      if (generatedImageUrl) {
        addMessage("bot", "Sua imagem em alta resolução:", generatedImageUrl)
      }

      setCurrentStep("complete")
    }
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
          <ChatMessage
            key={message.id}
            message={message}
            onSimulatePayment={handleSimulatePayment}
            onCheckPayment={handleCheckPayment}
          />
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
            generationProgress={generationProgress}
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

        {/* Elemento invisível para scroll automático */}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      {showInput && !isTyping && (
        <div className="q-and-a">
          <div className="input-container">
            <input
              ref={inputRef}
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
    </div>
  )
}
