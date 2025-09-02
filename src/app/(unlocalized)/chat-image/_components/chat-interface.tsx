"use client"

import { useState, useRef, useEffect } from "react"
import { Send, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { toast } from "sonner"

import { ChatMessage, type ChatMessageProps } from "./chat-message"
import { ChatImageUpload } from "./chat-image-upload"

type ChatStep = "name" | "player-photo" | "generating" | "completed"

interface ChatState {
  step: ChatStep
  userName: string
  playerImageUrl: string
  generatedImageUrl: string
}

const FIXED_BACKGROUND_URL = "https://iynirubuonhsnxzzmrry.supabase.co/storage/v1/object/public/fotos/temp-1756770236033-2.jpeg"

export function ChatInterface() {
  const [chatState, setChatState] = useState<ChatState>({
    step: "name",
    userName: "",
    playerImageUrl: "",
    generatedImageUrl: "",
  })
  
  const [messages, setMessages] = useState<ChatMessageProps[]>([
    {
      type: "bot",
      content: "Olá! Vou te ajudar a criar uma imagem personalizada. Qual o seu nome?",
      timestamp: new Date(),
    },
  ])
  
  const [inputValue, setInputValue] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto scroll to bottom
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]')
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

  const addMessage = (message: Omit<ChatMessageProps, "timestamp">) => {
    setMessages(prev => [...prev, { ...message, timestamp: new Date() }])
  }

  const addBotMessage = async (content: string, delay = 1000) => {
    setIsTyping(true)
    setMessages(prev => [...prev, { 
      type: "bot", 
      content: "", 
      isTyping: true,
      timestamp: new Date()
    }])
    
    await new Promise(resolve => setTimeout(resolve, delay))
    
    setMessages(prev => [
      ...prev.slice(0, -1),
      { type: "bot", content, timestamp: new Date() }
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

    setChatState(prev => ({ ...prev, userName: name, step: "player-photo" }))
    setInputValue("")

    await addBotMessage(
      `Oi ${name}! Agora envie uma foto sua:`,
      1500
    )
  }

  const handlePlayerImageUploaded = async (imageUrl: string) => {
    // Se já estamos na etapa completed, significa que é uma nova foto
    const isNewPhoto = chatState.step === "completed"
    
    setChatState(prev => ({ ...prev, playerImageUrl: imageUrl, step: "generating" }))
    
    await addBotMessage(
      "Perfeito! Foto recebida. ✅",
      1000
    )
    
    // Show the uploaded image
    addMessage({
      type: "bot",
      content: isNewPhoto ? "Nova foto:" : "Sua foto:",
      imageUrl: imageUrl,
    })
    
    await addBotMessage(
      "Uma foto incrível para você está sendo criada",
      1500
    )

    // Generate image immediately
    try {
      const response = await fetch("/api/chat-image/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerImageUrl: imageUrl,
          backgroundImageUrl: FIXED_BACKGROUND_URL,
          userName: chatState.userName,
        }),
      })

      const data = await response.json()

      if (data.success) {
        const generatedImageUrl = `data:image/png;base64,${data.imageBase64}`
        setChatState(prev => ({ 
          ...prev, 
          generatedImageUrl,
          step: "completed" 
        }))
        
        await addBotMessage("Pronto! Aqui está sua imagem personalizada:", 1000)
        
        addMessage({
          type: "bot",
          content: "Você pode clicar na imagem para ver em tamanho completo em uma nova aba.",
          imageUrl: generatedImageUrl,
        })
        
        await addBotMessage("Quer subir outra foto?", 1500)
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error("Error generating image:", error)
      await addBotMessage("Ops! Houve um erro ao gerar a imagem. Tente novamente mais tarde.")
      toast.error("Erro ao gerar imagem")
    }
  }


  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      if (chatState.step === "name") {
        handleNameSubmit()
      }
    }
  }

  const canShowInput = chatState.step === "name" && !isTyping
  const canShowPlayerUpload = chatState.step === "player-photo" && !isTyping
  const canShowNewPhotoOption = chatState.step === "completed" && !isTyping

  return (
    <div className="flex flex-col h-full">
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
        </div>
      </ScrollArea>

      {/* Input Area */}
      {canShowInput && (
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
              <Button 
                onClick={handleNameSubmit}
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