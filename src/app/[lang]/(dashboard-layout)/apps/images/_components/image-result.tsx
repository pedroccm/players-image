"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Download, Loader2, Save } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

interface ImageResultProps {
  imageBase64: string
  prompt: string
  onSaveToSupabase?: (imageBase64: string) => Promise<void>
}

export function ImageResult({
  imageBase64,
  prompt,
  onSaveToSupabase,
}: ImageResultProps) {
  const [isSaving, setIsSaving] = useState(false)

  const downloadImage = () => {
    const link = document.createElement("a")
    link.href = `data:image/png;base64,${imageBase64}`
    link.download = `ai-generated-image-${Date.now()}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success("Image downloaded successfully!")
  }

  const handleSaveToSupabase = async () => {
    if (!onSaveToSupabase) return

    try {
      setIsSaving(true)
      await onSaveToSupabase(imageBase64)
      toast.success("Image saved to gallery!")
    } catch (error) {
      toast.error("Failed to save image")
      console.error("Save error:", error)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Generated Image</CardTitle>
        <CardDescription>
          Your AI-generated image is ready! You can download it or save it to
          your gallery.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col space-y-4">
          <div className="bg-muted/50 rounded-lg p-4">
            <h4 className="font-semibold mb-2">Prompt used:</h4>
            <p className="text-sm text-muted-foreground">{prompt}</p>
          </div>

          <div className="flex justify-center">
            <img
              src={`data:image/png;base64,${imageBase64}`}
              alt="Generated AI image"
              className="max-w-full max-h-[600px] object-contain rounded-lg border shadow-lg"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={downloadImage} variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Download Image
            </Button>

            {onSaveToSupabase && (
              <Button onClick={handleSaveToSupabase} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save to Gallery
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
