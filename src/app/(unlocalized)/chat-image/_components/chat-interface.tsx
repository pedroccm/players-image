"use client"

import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { Loader2, Send } from "lucide-react"

import type { ChatMessageProps } from "./chat-message"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { BackgroundSelector } from "./background-selector"
import { ChatImageUpload } from "./chat-image-upload"
import { ChatMessage } from "./chat-message"

type ChatStep =
  | "name"
  | "player-photo"
  | "background-selection"
  | "game-location"
  | "game-datetime"
  | "generating"
  | "completed"
  | "payment-offer"
  | "payment-waiting"
  | "payment-completed"

interface ChatState {
  step: ChatStep
  userName: string
  playerImageUrl: string
  selectedBackgroundUrl: string
  gameLocation: string
  gameDateTime: string
  generatedImageUrl: string
  hasPremium: boolean
}

const BACKGROUND_OPTIONS = [
  "https://iynirubuonhsnxzzmrry.supabase.co/storage/v1/object/public/fotos/bg.png",
  "https://iynirubuonhsnxzzmrry.supabase.co/storage/v1/object/public/fotos/bg1.png",
  "https://iynirubuonhsnxzzmrry.supabase.co/storage/v1/object/public/fotos/bg2.png",
  "https://iynirubuonhsnxzzmrry.supabase.co/storage/v1/object/public/fotos/bg3.png",
  "https://iynirubuonhsnxzzmrry.supabase.co/storage/v1/object/public/fotos/bg4.png",
]

export function ChatInterface() {
  // All hooks must be at the top - Rules of Hooks
  const [chatState, setChatState] = useState<ChatState>({
    step: "name",
    userName: "",
    playerImageUrl: "",
    selectedBackgroundUrl: "",
    gameLocation: "",
    gameDateTime: "",
    generatedImageUrl: "",
    hasPremium: false,
  })

  const [messages, setMessages] = useState<ChatMessageProps[]>([])
  const [isInitialized, setIsInitialized] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [inputValue, setInputValue] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [_paymentPollingId, _setPaymentPollingId] = useState<string | null>(
    null
  )
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto scroll to bottom
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector(
        "[data-radix-scroll-area-viewport]"
      )
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight
      }
    }
  }, [messages])

  // Focus input after bot messages
  useEffect(() => {
    if (!isTyping && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isTyping])

  // Ensure client-side only rendering
  useEffect(() => {
    setMounted(true)
  }, [])

  // Initialize messages once
  useEffect(() => {
    if (!isInitialized) {
      setMessages([
        {
          type: "bot",
          content:
            "Olá! Vou te ajudar a criar uma imagem personalizada. Qual o seu nome?",
          timestamp: new Date(),
        },
      ])
      setIsInitialized(true)
    }
  }, [isInitialized])

  const addMessage = (message: Omit<ChatMessageProps, "timestamp">) => {
    setMessages((prev) => [...prev, { ...message, timestamp: new Date() }])
  }

  const addBotMessage = async (content: string, delay = 1000) => {
    setIsTyping(true)
    setMessages((prev) => [
      ...prev,
      {
        type: "bot",
        content: "",
        isTyping: true,
        timestamp: new Date(),
      },
    ])

    await new Promise((resolve) => setTimeout(resolve, delay))

    setMessages((prev) => [
      ...prev.slice(0, -1),
      { type: "bot", content, timestamp: new Date() },
    ])
    setIsTyping(false)
  }

  const handleNameSubmit = async () => {
    if (!inputValue.trim()) return

    const name = inputValue.trim()
    addMessage({
      type: "user",
      content: name,
      userName: name,
    })

    setChatState((prev) => ({ ...prev, userName: name, step: "player-photo" }))
    setInputValue("")

    await addBotMessage(`Oi ${name}! Agora envie uma foto sua:`, 1500)
  }

  const handlePlayerImageUploaded = async (imageUrl: string) => {
    // Se já estamos na etapa completed, significa que é uma nova foto
    const isNewPhoto = chatState.step === "completed"

    setChatState((prev) => ({
      ...prev,
      playerImageUrl: imageUrl,
      step: isNewPhoto ? "background-selection" : "background-selection",
    }))

    await addBotMessage("Perfeito! Foto recebida. ✅", 1000)

    // Show the uploaded image
    addMessage({
      type: "bot",
      content: isNewPhoto ? "Nova foto:" : "Sua foto:",
      imageUrl: imageUrl,
    })

    await addBotMessage(
      "Agora escolha o fundo que você quer para sua imagem:",
      1500
    )
  }

  const handleBackgroundSelected = async (backgroundUrl: string) => {
    setChatState((prev) => ({
      ...prev,
      selectedBackgroundUrl: backgroundUrl,
      step: "game-location",
    }))

    await addBotMessage("Ótima escolha! ✅", 1000)
    await addBotMessage("Agora me diga o local do jogo:", 1500)
  }

  const handleGameLocationSubmit = async () => {
    if (!inputValue.trim()) return

    const location = inputValue.trim()
    addMessage({
      type: "user",
      content: location,
      userName: chatState.userName,
    })

    setChatState((prev) => ({
      ...prev,
      gameLocation: location,
      step: "game-datetime",
    }))
    setInputValue("")

    await addBotMessage(
      `Local: ${location}! Agora me diga a data e horário do jogo:`,
      1500
    )
  }

  const handleGameDateTimeSubmit = async () => {
    if (!inputValue.trim()) return

    const dateTime = inputValue.trim()
    addMessage({
      type: "user",
      content: dateTime,
      userName: chatState.userName,
    })

    setChatState((prev) => ({
      ...prev,
      gameDateTime: dateTime,
      step: "generating",
    }))
    setInputValue("")

    await addBotMessage(
      `Data/Horário: ${dateTime}! Uma foto incrível está sendo criada`,
      1500
    )

    // Generate image with location and datetime
    try {
      const response = await fetch("/api/chat-image/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerImageUrl: chatState.playerImageUrl,
          backgroundImageUrl: chatState.selectedBackgroundUrl,
          userName: chatState.userName,
          gameLocation: chatState.gameLocation,
          gameDateTime: dateTime, // Use the dateTime variable directly
          hasPremium: chatState.hasPremium,
        }),
      })

      const data = await response.json()

      if (data.success) {
        const generatedImageUrl = `data:image/png;base64,${data.imageBase64}`
        setChatState((prev) => ({
          ...prev,
          generatedImageUrl,
          step: "completed",
        }))

        await addBotMessage("Pronto! Aqui está sua imagem personalizada:", 1000)

        addMessage({
          type: "bot",
          content:
            "Você pode clicar na imagem para ver em tamanho completo em uma nova aba.",
          imageUrl: generatedImageUrl,
        })

        await addBotMessage("Quer subir outra foto?", 1500)

        // Ask for payment after a short delay
        setTimeout(async () => {
          setChatState((prev) => ({ ...prev, step: "payment-offer" }))
          await addBotMessage(
            "💎 Quer desbloquear recursos premium por apenas R$ 3,00? Você terá acesso a filtros especiais e outras funcionalidades incríveis!",
            2000
          )
        }, 3000)
      } else {
        // Handle content blocked error specifically
        if (data.error === "content_blocked") {
          console.log("🚫 Content blocked - resetting to photo upload")

          setChatState((prev) => ({
            ...prev,
            step: "player-photo",
            playerImageUrl: "", // Clear the blocked image
          }))

          await addBotMessage(
            data.message ||
              "Essa foto não pôde ser processada. Por favor, envie outra foto.",
            1000
          )
          return // Don't throw error, just reset flow
        }

        throw new Error(data.message || data.error)
      }
    } catch (error) {
      console.error("Error generating image:", error)
      await addBotMessage(
        "Ops! Houve um erro ao gerar a imagem. Tente novamente mais tarde."
      )
      toast.error("Erro ao gerar imagem")
    }
  }

  const handlePaymentAccept = async () => {
    addMessage({
      type: "user",
      content: "💳 Sim, quero premium!",
      userName: chatState.userName,
    })

    await addBotMessage("Perfeito! Criando seu pagamento PIX...", 1000)

    try {
      const response = await fetch("/api/abacatepay/create-qrcode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userName: chatState.userName }),
      })

      const data = await response.json()

      if (data.success) {
        // Adicionar mensagem com dados PIX
        addMessage({
          type: "bot",
          content: "Aqui está seu pagamento PIX:",
          pixData: {
            qrCodeImage: data.data.brCodeBase64,
            brCode: data.data.brCode,
            amount: data.data.amount,
            paymentId: data.data.id,
          },
        })

        // Armazenar ID para uso nos botões
        setChatState((prev) => ({ ...prev, step: "payment-waiting" }))
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error("Error creating payment:", error)
      await addBotMessage(
        "Ops! Houve um erro ao criar o pagamento. Tente novamente."
      )
      toast.error("Erro ao criar pagamento")
    }
  }

  const handlePaymentDecline = async () => {
    addMessage({
      type: "user",
      content: "Não, obrigado",
      userName: chatState.userName,
    })

    setChatState((prev) => ({ ...prev, step: "completed" }))
    await addBotMessage(
      "Tudo bem! Você ainda pode subir mais fotos quando quiser.",
      1000
    )
  }

  const handleSimulatePayment = async (paymentId: string) => {
    try {
      await addBotMessage("Simulando pagamento...", 500)

      const response = await fetch("/api/abacatepay/simulate-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId }),
      })

      const data = await response.json()

      if (data.success) {
        await addBotMessage(
          "✅ Pagamento simulado com sucesso! Agora clique em 'Pagamento Concluído' para verificar.",
          1000
        )
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error("Error simulating payment:", error)
      await addBotMessage("❌ Erro ao simular pagamento. Tente novamente.")
      toast.error("Erro ao simular pagamento")
    }
  }

  const handleCheckPayment = async (paymentId: string) => {
    try {
      await addBotMessage("Verificando pagamento...", 500)

      const response = await fetch(
        `/api/abacatepay/check-payment?id=${paymentId}`
      )
      const data = await response.json()

      if (data.success) {
        if (data.data.status === "PAID") {
          await handlePaymentCompleted()
        } else {
          await addBotMessage(
            `❌ Pagamento ainda não confirmado. Status: ${data.data.status}`,
            1000
          )
        }
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error("Error checking payment:", error)
      await addBotMessage("❌ Erro ao verificar pagamento. Tente novamente.")
      toast.error("Erro ao verificar pagamento")
    }
  }

  const handlePaymentCompleted = async () => {
    setChatState((prev) => ({
      ...prev,
      step: "payment-completed",
      hasPremium: true,
    }))

    await addBotMessage(
      "🎉 Pagamento confirmado! Parabéns, agora você tem acesso premium!",
      1000
    )
    await addBotMessage("Gerando sua imagem premium sem marca d'água...", 1500)

    // Regenerate image without watermark
    try {
      const response = await fetch("/api/chat-image/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerImageUrl: chatState.playerImageUrl,
          backgroundImageUrl: chatState.selectedBackgroundUrl,
          userName: chatState.userName,
          gameLocation: chatState.gameLocation,
          gameDateTime: chatState.gameDateTime,
          hasPremium: true, // This is the key difference
        }),
      })

      const data = await response.json()

      if (data.success) {
        const premiumImageUrl = `data:image/png;base64,${data.imageBase64}`

        // Update state with premium image
        setChatState((prev) => ({
          ...prev,
          generatedImageUrl: premiumImageUrl,
        }))

        await addBotMessage(
          "Aqui está sua imagem premium em alta resolução:",
          1000
        )

        // Show the premium image without watermark
        addMessage({
          type: "bot",
          content: "Sua imagem premium em alta resolução:",
          imageUrl: premiumImageUrl,
        })

        await addBotMessage("Continue explorando os recursos premium! 🚀", 2000)
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error("Error generating premium image:", error)
      await addBotMessage(
        "❌ Erro ao gerar imagem premium. Mostrando a versão anterior."
      )

      // Fallback to showing the original image
      addMessage({
        type: "bot",
        content: "Sua imagem premium em alta resolução:",
        imageUrl: chatState.generatedImageUrl,
      })
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      if (chatState.step === "name") {
        handleNameSubmit()
      } else if (chatState.step === "game-location") {
        handleGameLocationSubmit()
      } else if (chatState.step === "game-datetime") {
        handleGameDateTimeSubmit()
      }
    }
  }

  // Show loading only if not initialized yet
  if (!mounted || !isInitialized) {
    return (
      <div className="flex flex-col h-full" suppressHydrationWarning>
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  const canShowNameInput =
    chatState.step === "name" && !isTyping && isInitialized
  const canShowLocationInput =
    chatState.step === "game-location" && !isTyping && isInitialized
  const canShowDateTimeInput =
    chatState.step === "game-datetime" && !isTyping && isInitialized
  const canShowPlayerUpload =
    chatState.step === "player-photo" && !isTyping && isInitialized
  const canShowBackgroundSelection =
    chatState.step === "background-selection" && !isTyping && isInitialized
  const canShowNewPhotoOption =
    (chatState.step === "completed" ||
      chatState.step === "payment-completed") &&
    !isTyping &&
    isInitialized
  const canShowPaymentButtons =
    chatState.step === "payment-offer" && !isTyping && isInitialized

  return (
    <div className="flex flex-col h-full" suppressHydrationWarning>
      {/* Messages */}
      <ScrollArea
        ref={scrollAreaRef}
        className="flex-1 p-4"
        suppressHydrationWarning
      >
        <div className="space-y-4 max-w-4xl mx-auto" suppressHydrationWarning>
          {messages.map((message, index) => (
            <ChatMessage
              key={index}
              {...message}
              userName={chatState.userName}
              onSimulatePayment={handleSimulatePayment}
              onCheckPayment={handleCheckPayment}
            />
          ))}

          {/* Upload areas */}
          {canShowPlayerUpload && (
            <div className="p-4">
              <ChatImageUpload
                label="Your Photo"
                onImageUploaded={handlePlayerImageUploaded}
              />
            </div>
          )}

          {canShowBackgroundSelection && (
            <div className="p-4">
              <BackgroundSelector
                backgrounds={BACKGROUND_OPTIONS}
                onSelect={handleBackgroundSelected}
              />
            </div>
          )}

          {canShowNewPhotoOption && (
            <div className="p-4">
              <ChatImageUpload
                label="Nova Foto"
                onImageUploaded={handlePlayerImageUploaded}
              />
            </div>
          )}

          {/* Payment Buttons */}
          {canShowPaymentButtons && (
            <div className="p-4 flex gap-3 justify-center">
              <Button
                onClick={handlePaymentAccept}
                className="bg-green-600 hover:bg-green-700"
              >
                💳 Sim, quero premium!
              </Button>
              <Button variant="outline" onClick={handlePaymentDecline}>
                Não, obrigado
              </Button>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input Area - Name */}
      {canShowNameInput && (
        <div className="border-t p-4 bg-background/95 backdrop-blur">
          <div className="max-w-4xl mx-auto">
            <div className="flex gap-3">
              <Input
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Digite seu nome..."
                className="flex-1"
              />
              <Button onClick={handleNameSubmit} disabled={!inputValue.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Input Area - Game Location */}
      {canShowLocationInput && (
        <div className="border-t p-4 bg-background/95 backdrop-blur">
          <div className="max-w-4xl mx-auto">
            <div className="flex gap-3">
              <Input
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Digite o local do jogo..."
                className="flex-1"
              />
              <Button
                onClick={handleGameLocationSubmit}
                disabled={!inputValue.trim()}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Input Area - Game Date/Time */}
      {canShowDateTimeInput && (
        <div className="border-t p-4 bg-background/95 backdrop-blur">
          <div className="max-w-4xl mx-auto">
            <div className="flex gap-3">
              <Input
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ex: 15/12/2024 - 16:00"
                className="flex-1"
              />
              <Button
                onClick={handleGameDateTimeSubmit}
                disabled={!inputValue.trim()}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Loading indicator for generation */}
      {chatState.step === "generating" && (
        <div className="border-t p-4 bg-background/95">
          <div className="max-w-4xl mx-auto flex items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Gerando sua imagem personalizada...</span>
          </div>
        </div>
      )}
    </div>
  )
}
