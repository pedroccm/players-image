"use client"

import { useState } from "react"
import { toast } from "sonner"
import { CheckCircle, Copy, Download } from "lucide-react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"

export interface ChatMessageProps {
  type: "bot" | "user"
  content: string
  timestamp?: Date
  imageUrl?: string
  userName?: string
  isTyping?: boolean
  pixData?: {
    qrCodeImage: string
    brCode: string
    amount: number
    paymentId: string
  }
  onSimulatePayment?: (paymentId: string) => void
  onCheckPayment?: (paymentId: string) => void
}

export function ChatMessage({
  type,
  content,
  timestamp,
  imageUrl,
  userName,
  isTyping = false,
  pixData,
  onSimulatePayment,
  onCheckPayment,
}: ChatMessageProps) {
  const isBot = type === "bot"
  const [copied, setCopied] = useState(false)

  const downloadImage = () => {
    if (imageUrl) {
      const link = document.createElement("a")
      link.href = imageUrl
      link.download = `mixed-image-${Date.now()}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  const copyPixCode = async () => {
    if (!pixData?.brCode) return

    try {
      await navigator.clipboard.writeText(pixData.brCode)
      setCopied(true)
      toast.success("Código PIX copiado!")
      setTimeout(() => setCopied(false), 2000)
    } catch (_error) {
      toast.error("Erro ao copiar código")
    }
  }

  return (
    <div className={`flex gap-3 p-4 ${isBot ? "bg-muted/30" : ""}`}>
      {isBot && (
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-primary text-primary-foreground text-xs">
            AI
          </AvatarFallback>
        </Avatar>
      )}

      <div
        className={`flex-1 space-y-2 ${!isBot ? "ml-auto max-w-[80%]" : ""}`}
      >
        <div
          className={`flex items-center gap-2 ${!isBot ? "justify-end" : ""}`}
        >
          {!isBot && userName && (
            <span className="text-sm font-medium">{userName}</span>
          )}
          {timestamp && (
            <span
              className="text-xs text-muted-foreground"
              suppressHydrationWarning
            >
              {timestamp.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          )}
        </div>

        {isTyping ? (
          <div className="flex items-center gap-1 text-muted-foreground">
            <div className="flex gap-1">
              <div className="w-2 h-2 bg-current rounded-full animate-pulse"></div>
              <div
                className="w-2 h-2 bg-current rounded-full animate-pulse"
                style={{ animationDelay: "0.2s" }}
              ></div>
              <div
                className="w-2 h-2 bg-current rounded-full animate-pulse"
                style={{ animationDelay: "0.4s" }}
              ></div>
            </div>
            <span className="text-sm ml-2">digitando...</span>
          </div>
        ) : (
          <>
            <div
              className={`rounded-2xl px-4 py-2 max-w-fit ${
                isBot
                  ? "bg-white border text-foreground"
                  : "bg-primary text-primary-foreground ml-auto"
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{content}</p>
            </div>

            {imageUrl && (
              <div className={`max-w-sm ${!isBot ? "ml-auto" : ""}`}>
                <div className="relative">
                  <img
                    src={imageUrl}
                    alt="Generated image"
                    className="rounded-lg border shadow-sm w-full cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      window.open(imageUrl, "_blank", "noopener,noreferrer")
                    }}
                    title="Clique para ver em tamanho completo"
                  />
                  <Button
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={downloadImage}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </Button>
                </div>
              </div>
            )}

            {pixData && (
              <div className={`max-w-md ${!isBot ? "ml-auto" : ""}`}>
                <div className="space-y-4 p-4 border rounded-lg bg-white">
                  {/* Valor */}
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-green-600">
                      PIX - R$ {(pixData.amount / 100).toFixed(2)}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Escaneie o QR Code ou use o código copia e cola
                    </p>
                  </div>

                  {/* QR Code */}
                  <div className="flex justify-center">
                    <div className="bg-white p-3 rounded-lg border">
                      <img
                        src={pixData.qrCodeImage}
                        alt="QR Code PIX"
                        className="w-48 h-48"
                      />
                    </div>
                  </div>

                  {/* Código copia e cola */}
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">
                      Código PIX copia e cola:
                    </label>
                    <div className="flex gap-2">
                      <div className="flex-1 p-2 bg-gray-50 rounded border text-xs font-mono break-all max-h-20 overflow-y-auto">
                        {pixData.brCode}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={copyPixCode}
                        className="shrink-0"
                      >
                        {copied ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Instruções */}
                  <div className="text-xs text-muted-foreground space-y-1 bg-blue-50 p-3 rounded">
                    <p>• Abra seu app do banco ou carteira digital</p>
                    <p>• Escaneie o QR Code ou cole o código PIX</p>
                    <p>• Confirme o pagamento</p>
                    <p>• Use os botões abaixo para testar:</p>
                  </div>

                  {/* Botões de teste */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onSimulatePayment?.(pixData.paymentId)}
                      className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-700"
                    >
                      🔵 Simular Pagamento
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onCheckPayment?.(pixData.paymentId)}
                      className="flex-1 bg-green-50 hover:bg-green-100 text-green-700"
                    >
                      🟢 Pagamento Concluído
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {!isBot && (
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-secondary text-secondary-foreground text-xs">
            {userName ? userName[0].toUpperCase() : "U"}
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  )
}
