"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { FormImageUpload } from "./form-image-upload"

export function FormInterface() {
  const [imageUrl, setImageUrl] = useState("")
  const [customPrompt, setCustomPrompt] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null)

  const handleImageUploaded = (uploadedImageUrl: string) => {
    setImageUrl(uploadedImageUrl)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validação
    if (!imageUrl) {
      toast.error("Por favor, faça upload de uma imagem")
      return
    }
    if (!customPrompt.trim()) {
      toast.error("Por favor, descreva o que você quer fazer com a imagem")
      return
    }

    setIsGenerating(true)

    try {
      const response = await fetch("/api/banana-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl: imageUrl,
          customPrompt: customPrompt,
        }),
      })

      const data = await response.json()

      if (data.success) {
        const imageUrl = `data:image/png;base64,${data.imageBase64}`
        setGeneratedImageUrl(imageUrl)
        toast.success("Imagem gerada com sucesso!")
      } else {
        if (data.error === "content_blocked") {
          toast.error("Essa foto não pôde ser processada. Tente outra foto.")
          setImageUrl("")
        } else {
          throw new Error(data.message || data.error)
        }
      }
    } catch (error) {
      console.error("Error generating image:", error)
      
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido"
      if (errorMessage.includes("temporariamente sobrecarregado")) {
        toast.error("Servidor temporariamente indisponível. Tente novamente em alguns minutos.")
      } else {
        toast.error("Erro ao gerar imagem. Tente novamente.")
      }
    } finally {
      setIsGenerating(false)
    }
  }

  const isFormValid = imageUrl && customPrompt.trim()

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Transforme sua Imagem com IA</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Upload da imagem */}
            <div className="space-y-2">
              <Label>Faça upload da sua imagem *</Label>
              <FormImageUpload
                label="Imagem"
                onImageUploaded={handleImageUploaded}
                currentImageUrl={imageUrl}
              />
            </div>

            {/* Prompt */}
            <div className="space-y-2">
              <Label htmlFor="customPrompt">
                O que você quer fazer com esta imagem? *
              </Label>
              <Textarea
                id="customPrompt"
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="Ex: Remova o fundo e coloque um céu estrelado, transforme em desenho animado, adicione efeitos de luz..."
                rows={4}
                required
              />
              <p className="text-xs text-muted-foreground">
                Descreva em detalhes como você quer transformar sua imagem
              </p>
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
    </div>
  )
}