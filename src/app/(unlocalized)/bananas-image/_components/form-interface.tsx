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
  const [imageUrl1, setImageUrl1] = useState("")
  const [imageUrl2, setImageUrl2] = useState("")
  const [customPrompt, setCustomPrompt] = useState(
    "Junte a imagem 1 com a imagem 2. No formato 9:16."
  )
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(
    null
  )

  const handleImageUploaded1 = (uploadedImageUrl: string) => {
    setImageUrl1(uploadedImageUrl)
  }

  const handleImageUploaded2 = (uploadedImageUrl: string) => {
    setImageUrl2(uploadedImageUrl)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validação
    if (!imageUrl1) {
      toast.error("Por favor, faça upload da primeira imagem")
      return
    }
    if (!imageUrl2) {
      toast.error("Por favor, faça upload da segunda imagem")
      return
    }
    if (!customPrompt.trim()) {
      toast.error("Por favor, descreva o que você quer fazer com as imagens")
      return
    }

    setIsGenerating(true)

    try {
      const response = await fetch("/api/bananas-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl1: imageUrl1,
          imageUrl2: imageUrl2,
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
          toast.error(
            "Essas fotos não puderam ser processadas. Tente outras fotos."
          )
          setImageUrl1("")
          setImageUrl2("")
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

  const isFormValid = imageUrl1 && imageUrl2 && customPrompt.trim()

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Transforme suas Duas Imagens com IA</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Upload das imagens */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Primeira Imagem *</Label>
                <FormImageUpload
                  label="Primeira Imagem"
                  onImageUploaded={handleImageUploaded1}
                  currentImageUrl={imageUrl1}
                />
              </div>
              <div className="space-y-2">
                <Label>Segunda Imagem *</Label>
                <FormImageUpload
                  label="Segunda Imagem"
                  onImageUploaded={handleImageUploaded2}
                  currentImageUrl={imageUrl2}
                />
              </div>
            </div>

            {/* Prompt */}
            <div className="space-y-2">
              <Label htmlFor="customPrompt">
                O que você quer fazer com estas duas imagens? *
              </Label>
              <Textarea
                id="customPrompt"
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="Junte a imagem 1 com a imagem 2. No formato 9:16."
                rows={4}
                required
              />
              <p className="text-xs text-muted-foreground">
                O prompt padrão junta as duas imagens no formato 9:16. Você pode
                editar conforme necessário.
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
