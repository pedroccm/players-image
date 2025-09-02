"use client"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"

export interface ChatMessageProps {
  type: "bot" | "user"
  content: string
  timestamp?: Date
  imageUrl?: string
  userName?: string
  isTyping?: boolean
}

export function ChatMessage({ 
  type, 
  content, 
  timestamp, 
  imageUrl, 
  userName,
  isTyping = false 
}: ChatMessageProps) {
  const isBot = type === "bot"

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

  return (
    <div className={`flex gap-3 p-4 ${isBot ? "bg-muted/30" : ""}`}>
      {isBot && (
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-primary text-primary-foreground text-xs">
            AI
          </AvatarFallback>
        </Avatar>
      )}
      
      <div className={`flex-1 space-y-2 ${!isBot ? "ml-auto max-w-[80%]" : ""}`}>
        <div className={`flex items-center gap-2 ${!isBot ? "justify-end" : ""}`}>
          {!isBot && userName && (
            <span className="text-sm font-medium">{userName}</span>
          )}
          {timestamp && (
            <span className="text-xs text-muted-foreground">
              {timestamp.toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </span>
          )}
        </div>

        {isTyping ? (
          <div className="flex items-center gap-1 text-muted-foreground">
            <div className="flex gap-1">
              <div className="w-2 h-2 bg-current rounded-full animate-pulse"></div>
              <div className="w-2 h-2 bg-current rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-2 h-2 bg-current rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
            </div>
            <span className="text-sm ml-2">AI está digitando...</span>
          </div>
        ) : (
          <>
            <div className={`rounded-2xl px-4 py-2 max-w-fit ${
              isBot 
                ? "bg-white border text-foreground" 
                : "bg-primary text-primary-foreground ml-auto"
            }`}>
              <p className="text-sm whitespace-pre-wrap">{content}</p>
            </div>

            {imageUrl && (
              <div className={`max-w-sm ${!isBot ? "ml-auto" : ""}`}>
                <div className="relative">
                  <img
                    src={imageUrl}
                    alt="Generated image"
                    className="rounded-lg border shadow-sm w-full"
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