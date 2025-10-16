"use client"

import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"
import { Bot, Image, Loader2, Plus, Send, User } from "lucide-react"

import { getTeamNameById } from "@/lib/teams"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
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
  | "complete"

export default function ChatNewImagePage() {
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

  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(
    null
  )

  // Dynamic backgrounds states
  const [generatedBackgrounds, setGeneratedBackgrounds] = useState<string[]>([])
  const [isGeneratingBackgrounds, setIsGeneratingBackgrounds] = useState(false)
  const [backgroundProgress, setBackgroundProgress] = useState({
    current: 0,
    total: 3,
    percentage: 0,
  })

  useEffect(() => {
    setMounted(true)
  }, [])

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
    (content: string, delay = 1000) => {
      setIsTyping(true)
      setTimeout(() => {
        setIsTyping(false)
        addMessage("bot", content)
      }, delay)
    },
    [addMessage]
  )

  // Initialize chat
  useEffect(() => {
    if (mounted && messages.length === 0) {
      addBotMessage(
        "👋 Bem-vindo ao Players MatchDay!\n\nAqui você pode gerar artes personalizadas do seu jogo ou só uma foto estilizada para bombar no Insta.\n\nBora criar a sua? 🚀",
        500
      )
      setTimeout(() => {
        setCurrentStep("name")
        addBotMessage("Qual é o seu nome?", 2000)
      }, 2500)
    }
  }, [mounted, messages.length, addBotMessage])

  const createSmartProgress = useCallback((current: number, total: number) => {
    let progress = 0
    let timer: NodeJS.Timeout
    const duration = 40000
    const interval = 100
    const maxProgressWithoutResponse = 98

    const updateProgress = () => {
      progress += (interval / duration) * 100
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

    updateProgress()

    return {
      complete: () => {
        if (timer) clearTimeout(timer)
        setBackgroundProgress({ current, total, percentage: 100 })
      },
      cleanup: () => {
        if (timer) clearTimeout(timer)
      },
    }
  }, [])

  const generateBackgroundsForTeam = useCallback(
    async (teamId: string) => {
      setIsGeneratingBackgrounds(true)
      setGeneratedBackgrounds([])
      setBackgroundProgress({ current: 0, total: 3, percentage: 0 })

      try {
        const teamName = getTeamNameById(teamId)
        const maxBackgrounds = 3
        const allUrls: string[] = []

        for (let i = 1; i <= maxBackgrounds; i++) {
          let progressController: {
            complete: () => void
            cleanup: () => void
          } | null = null

          try {
            progressController = createSmartProgress(i, maxBackgrounds)

            const startResponse = await fetch(
              "/api/backgrounds/generate-async",
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ teamName, teamId }),
              }
            )

            const startData = await startResponse.json()

            if (!startData.success || !startData.jobId) {
              throw new Error(`Failed to start job: ${startData.error}`)
            }

            const jobId = startData.jobId
            let attempts = 0
            const maxAttempts = 120
            let data: {
              success: boolean
              urls: string[]
              error?: string
            } | null = null

            while (attempts < maxAttempts) {
              await new Promise((resolve) => setTimeout(resolve, 1000))

              const statusResponse = await fetch(
                `/api/backgrounds/status?jobId=${jobId}`
              )
              const statusData = await statusResponse.json()

              if (statusData.status === "completed") {
                data = { success: true, urls: statusData.result }
                break
              } else if (statusData.status === "failed") {
                throw new Error(`Job failed: ${statusData.error}`)
              }

              attempts++
            }

            if (!data) {
              throw new Error("Job timed out after 2 minutes")
            }

            progressController.complete()
            await new Promise((resolve) => setTimeout(resolve, 500))

            if (data.success && data.urls && Array.isArray(data.urls)) {
              allUrls.push(...data.urls)
              setGeneratedBackgrounds([...allUrls])
            }
          } catch (error) {
            console.error(`API call ${i} error:`, error)
            if (progressController) {
              progressController.complete()
              await new Promise((resolve) => setTimeout(resolve, 500))
            }
          } finally {
            if (progressController) {
              progressController.cleanup()
            }
          }
        }
      } catch (error) {
        console.error("Error generating backgrounds:", error)
        toast.error("Erro ao gerar backgrounds personalizados")
      } finally {
        setIsGeneratingBackgrounds(false)
      }
    },
    [createSmartProgress]
  )

  const handleUserResponse = (response: string) => {
    if (!response.trim()) return

    addMessage("user", response)
    setUserInput("")

    switch (currentStep) {
      case "name":
        setFormData((prev) => ({ ...prev, userName: response }))
        setCurrentStep("homeTeam")
        addBotMessage(
          `Irado, então me fala ${response}!\n\nO que você quer fazer hoje?`,
          1000
        )
        break

      case "homeTeam":
        addBotMessage("Nome do seu time", 1000)
        break

      case "awayTeam":
        addBotMessage("Nome do adversário", 1000)
        break

      case "location":
        setFormData((prev) => ({ ...prev, gameLocation: response }))
        setCurrentStep("datetime")
        addBotMessage("Irado, então me fala\n\nData e horário do jogo", 1000)
        break

      case "datetime":
        setFormData((prev) => ({ ...prev, gameDateTime: response }))
        setCurrentStep("complete")
        addBotMessage("Escolha o fundo*", 1000)
        break
    }
  }

  const handleTeamSelection = (teamId: string, isHome: boolean) => {
    if (isHome) {
      setFormData((prev) => ({ ...prev, homeTeam: teamId }))
      setCurrentStep("awayTeam")
      addBotMessage("Nome do adversário", 1000)
      generateBackgroundsForTeam(teamId)
    } else {
      setFormData((prev) => ({ ...prev, awayTeam: teamId }))
      setCurrentStep("background")
      addBotMessage("Escolha o fundo*", 1000)
    }
  }

  const handleBackgroundSelected = (backgroundUrl: string) => {
    setFormData((prev) => ({ ...prev, selectedBackgroundUrl: backgroundUrl }))
    setCurrentStep("photo")
    addBotMessage("📸 Agora me manda sua foto", 1000)
  }

  const handlePhotoUploaded = (imageUrl: string) => {
    setFormData((prev) => ({ ...prev, playerImageUrl: imageUrl }))
    setCurrentStep("location")
    addBotMessage("Local do jogo", 1000)
  }

  const generateImage = async () => {
    setIsGenerating(true)

    try {
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
        addMessage("bot", "🎉 Sua imagem foi gerada com sucesso!", imageUrl)
      } else {
        throw new Error(data.message || data.error)
      }
    } catch (error) {
      console.error("Error generating image:", error)
      addMessage("bot", "❌ Erro ao gerar imagem. Tente novamente.")
    } finally {
      setIsGenerating(false)
    }
  }

  const renderCurrentStepInput = () => {
    switch (currentStep) {
      case "homeTeam":
        return (
          <div className="space-y-2">
            <div className="bg-white rounded-lg border border-gray-200 p-3">
              <button className="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50">
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                  ⚽
                </div>
                <span className="text-gray-900 font-medium">
                  Criar arte de uma partida oficial
                </span>
              </button>
            </div>
            <TeamSelector
              value={formData.homeTeam}
              onValueChange={(teamId) => handleTeamSelection(teamId, true)}
              placeholder="Selecione seu time..."
            />
          </div>
        )

      case "awayTeam":
        return (
          <div className="bg-white rounded-lg border border-gray-200 p-3">
            <TeamSelector
              value={formData.awayTeam}
              onValueChange={(teamId) => handleTeamSelection(teamId, false)}
              placeholder="Selecione o adversário..."
            />
          </div>
        )

      case "background":
        return (
          <div className="bg-white rounded-lg border border-gray-200 p-3">
            {isGeneratingBackgrounds ? (
              <div className="space-y-4">
                <div className="text-center py-8">
                  <Loader2 className="animate-spin mx-auto mb-2" size={24} />
                  <p className="text-sm text-gray-600">
                    Gerando backgrounds personalizados...
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Background: {backgroundProgress.current}/
                    {backgroundProgress.total}
                  </p>
                  <div className="max-w-xs mx-auto mt-3">
                    <Progress
                      value={backgroundProgress.percentage}
                      className="h-2"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {Math.round(backgroundProgress.percentage)}% completo
                  </p>
                </div>
                <FormBackgroundSelector
                  backgrounds={[...BACKGROUND_OPTIONS, ...generatedBackgrounds]}
                  onSelect={handleBackgroundSelected}
                  selectedBackground={formData.selectedBackgroundUrl}
                />
              </div>
            ) : (
              <FormBackgroundSelector
                backgrounds={[...BACKGROUND_OPTIONS, ...generatedBackgrounds]}
                onSelect={handleBackgroundSelected}
                selectedBackground={formData.selectedBackgroundUrl}
              />
            )}
          </div>
        )

      case "photo":
        return (
          <div className="bg-white rounded-lg border border-gray-200 p-3">
            <FormImageUpload
              label="Sua Foto"
              onImageUploaded={handlePhotoUploaded}
              currentImageUrl={formData.playerImageUrl}
            />
          </div>
        )

      case "complete":
        return (
          <div className="bg-white">
            <Button
              onClick={generateImage}
              disabled={isGenerating}
              className="w-full bg-green-600 hover:bg-green-700 text-white rounded-full py-3 font-semibold text-lg"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Gerando imagem...
                </>
              ) : (
                "GERAR IMAGEM"
              )}
            </Button>
          </div>
        )

      default:
        return null
    }
  }

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin mx-auto mb-2" size={24} />
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 font-host-grotesk">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3 flex items-center gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden">
            <div className="w-full h-full bg-gradient-to-br from-blue-500 to-green-500 flex items-center justify-center">
              <div className="w-6 h-6 flex items-center justify-center">
                <div className="w-4 h-4 bg-yellow-400 rounded-sm"></div>
                <div className="w-3 h-3 bg-orange-500 rounded-sm -ml-1 mt-1"></div>
              </div>
            </div>
          </div>
          <div>
            <h1 className="font-semibold text-gray-900 text-lg">players.cx</h1>
          </div>
        </div>
      </div>

      {/* Chat Container */}
      <div className="max-w-md mx-auto bg-white min-h-screen flex flex-col relative">
        {/* Messages */}
        <div className="flex-1 p-4 space-y-4 overflow-y-auto pb-20">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}
            >
              <div className="flex items-start gap-2 max-w-[80%]">
                {message.type === "bot" && (
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <Bot className="w-3 h-3 text-white" />
                  </div>
                )}

                <div
                  className={`px-4 py-3 rounded-2xl max-w-[280px] ${
                    message.type === "user"
                      ? "bg-green-500 text-white rounded-br-md"
                      : "bg-gray-100 text-gray-900 rounded-bl-md"
                  }`}
                >
                  {message.content.split("\n").map((line, index) => (
                    <div key={index} className="whitespace-pre-wrap">
                      {line}
                    </div>
                  ))}

                  {message.imageUrl && (
                    <div className="mt-2">
                      <img
                        src={message.imageUrl}
                        alt="Generated"
                        className="max-w-full h-auto rounded-lg cursor-pointer"
                        onClick={() => window.open(message.imageUrl, "_blank")}
                      />
                    </div>
                  )}
                </div>

                {message.type === "user" && (
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <User className="w-3 h-3 text-white" />
                  </div>
                )}
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex justify-start">
              <div className="flex items-start gap-2">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <Bot className="w-3 h-3 text-white" />
                </div>
                <div className="bg-gray-100 px-4 py-2 rounded-2xl">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.1s" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Current Step Input */}
        {currentStep !== "welcome" && currentStep !== "complete" && (
          <div className="absolute bottom-0 left-0 right-0 bg-white border-t p-4">
            {renderCurrentStepInput()}
          </div>
        )}

        {/* Text Input */}
        {(currentStep === "name" ||
          currentStep === "location" ||
          currentStep === "datetime") && (
          <div className="absolute bottom-0 left-0 right-0 bg-white border-t p-4">
            <div className="flex gap-2 items-center">
              <div className="flex-1 relative">
                <Input
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      handleUserResponse(userInput)
                    }
                  }}
                  placeholder="Digite sua resposta..."
                  className="pr-12 rounded-full bg-gray-100 border-0 focus:ring-2 focus:ring-green-500"
                />
                <Button
                  onClick={() => handleUserResponse(userInput)}
                  disabled={!userInput.trim()}
                  size="sm"
                  className="absolute right-1 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-green-600 hover:bg-green-700 p-0"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Generate Button */}
        {currentStep === "complete" && (
          <div className="absolute bottom-0 left-0 right-0 bg-white border-t p-4">
            {renderCurrentStepInput()}
          </div>
        )}
      </div>
    </div>
  )
}
