"use client"

import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { Loader2, Send } from "lucide-react"

import type { ChatMessageProps } from "./chat-message"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ChatImageUpload } from "./chat-image-upload"
import { ChatMessage } from "./chat-message"
import { PaymentModal } from "./payment-modal"

type ChatStep =
  | "name"
  | "player-photo"
  | "game-location"
  | "generating"
  | "completed"
  | "payment-offer"
  | "payment-completed"

interface ChatState {
  step: ChatStep
  userName: string
  playerImageUrl: string
  gameLocation: string
  generatedImageUrl: string
  hasPremium: boolean
}

const FIXED_BACKGROUND_URL =
  "https://iynirubuonhsnxzzmrry.supabase.co/storage/v1/object/public/fotos/freepik__an-abstract-digital-artwork-with-a-football-stadiu__46075.png"

export function ChatInterface() {
  // All hooks must be at the top - Rules of Hooks
  const [chatState, setChatState] = useState<ChatState>({
    step: "name",
    userName: "",
    playerImageUrl: "",
    gameLocation: "",
    generatedImageUrl: "",
    hasPremium: false,
  })

  const [messages, setMessages] = useState<ChatMessageProps[]>([])
  const [isInitialized, setIsInitialized] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [inputValue, setInputValue] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
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

  // Initialize messages on client side to avoid hydration mismatch
  useEffect(() => {
    if (mounted && !isInitialized) {
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
  }, [mounted, isInitialized])

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
      step: isNewPhoto ? "game-location" : "game-location",
    }))

    await addBotMessage("Perfeito! Foto recebida. ✅", 1000)

    // Show the uploaded image
    addMessage({
      type: "bot",
      content: isNewPhoto ? "Nova foto:" : "Sua foto:",
      imageUrl: imageUrl,
    })

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
      step: "generating",
    }))
    setInputValue("")

    await addBotMessage(
      `Local: ${location}! Uma foto incrível está sendo criada`,
      1500
    )

    // Generate image with location
    try {
      const response = await fetch("/api/chat-image/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerImageUrl: chatState.playerImageUrl,
          backgroundImageUrl: FIXED_BACKGROUND_URL,
          userName: chatState.userName,
          gameLocation: location,
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
        throw new Error(data.error)
      }
    } catch (error) {
      console.error("Error generating image:", error)
      await addBotMessage(
        "Ops! Houve um erro ao gerar a imagem. Tente novamente mais tarde."
      )
      toast.error("Erro ao gerar imagem")
    }
  }

  const handlePaymentAccept = () => {
    setShowPaymentModal(true)
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

  const handlePaymentCompleted = async () => {
    setChatState((prev) => ({
      ...prev,
      step: "payment-completed",
      hasPremium: true,
    }))

    await addBotMessage(
      "🎉 Parabéns! Agora você tem acesso aos recursos premium! Continue explorando.",
      1500
    )
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      if (chatState.step === "name") {
        handleNameSubmit()
      } else if (chatState.step === "game-location") {
        handleGameLocationSubmit()
      }
    }
  }

  // Don't render anything until mounted on client
  if (!mounted) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  const canShowNameInput = chatState.step === "name" && !isTyping && isInitialized
  const canShowLocationInput = chatState.step === "game-location" && !isTyping && isInitialized
  const canShowPlayerUpload = chatState.step === "player-photo" && !isTyping && isInitialized
  const canShowNewPhotoOption =
    (chatState.step === "completed" ||
      chatState.step === "payment-completed") &&
    !isTyping && isInitialized
  const canShowPaymentButtons = chatState.step === "payment-offer" && !isTyping && isInitialized

  return (
    <div className="flex flex-col h-full" suppressHydrationWarning>
      {/* Messages */}
      <ScrollArea ref={scrollAreaRef} className="flex-1 p-4">
        <div className="space-y-4 max-w-4xl mx-auto">
          {messages.map((message, index) => (
            <ChatMessage
              key={index}
              {...message}
              userName={chatState.userName}
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

      {/* Loading indicator for generation */}
      {chatState.step === "generating" && (
        <div className="border-t p-4 bg-background/95">
          <div className="max-w-4xl mx-auto flex items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Gerando sua imagem personalizada...</span>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onPaymentCompleted={handlePaymentCompleted}
        userName={chatState.userName}
      />
    </div>
  )
}
