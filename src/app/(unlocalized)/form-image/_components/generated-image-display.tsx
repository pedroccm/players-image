"use client"

import { Download } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface GeneratedImageDisplayProps {
  imageUrl: string
  hasPremium: boolean
  onUpgradeToPremium: () => void
}

export function GeneratedImageDisplay({
  imageUrl,
  hasPremium,
  onUpgradeToPremium,
}: GeneratedImageDisplayProps) {
  const downloadImage = () => {
    const link = document.createElement("a")
    link.href = imageUrl
    link.download = `player-image-${Date.now()}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-green-600">✅ Imagem Gerada com Sucesso!</CardTitle>
        <CardDescription>
          Clique na imagem para ver em tamanho completo ou baixe usando o botão
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Imagem */}
        <div className="relative">
          <img
            src={imageUrl}
            alt="Imagem gerada"
            className="w-full max-w-md mx-auto rounded-lg border shadow-sm cursor-pointer hover:opacity-80 transition-opacity"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              window.open(imageUrl, "_blank", "noopener,noreferrer")
            }}
            title="Clique para ver em tamanho completo"
          />
        </div>

        {/* Botões */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={downloadImage} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Baixar Imagem
          </Button>
          
          {!hasPremium && (
            <Button onClick={onUpgradeToPremium} className="bg-green-600 hover:bg-green-700">
              💎 Upgrade Premium (R$ 3,00)
            </Button>
          )}
        </div>

        {/* Informação sobre Premium */}
        {!hasPremium && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
            <p className="text-sm text-blue-800">
              <strong>💎 Versão Premium:</strong> Remova a marca d&apos;água e obtenha
              acesso a recursos especiais por apenas R$ 3,00
            </p>
          </div>
        )}

        {hasPremium && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
            <p className="text-sm text-green-800">
              <strong>🎉 Premium Ativo:</strong> Sua imagem está em alta resolução
              sem marca d&apos;água!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}