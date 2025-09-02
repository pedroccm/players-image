"use client"

import { useState } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { ArrowLeft } from "lucide-react"

import type { ImageCreateFormData } from "../_schemas/image-create-schema"

import { Button } from "@/components/ui/button"
import { ImageResult } from "../_components/image-result"
import { ImageUploadForm } from "../_components/image-upload-form"

interface GeneratedImage {
  imageBase64: string
  prompt: string
}

export default function CreateImagePage() {
  const [isLoading, setIsLoading] = useState(false)
  const [generatedImage, setGeneratedImage] = useState<GeneratedImage | null>(
    null
  )

  const handleSubmit = async (data: ImageCreateFormData) => {
    try {
      setIsLoading(true)

      const formData = new FormData()
      formData.append("prompt", data.prompt)

      // Add images (files or URLs)
      if (data.image1File) {
        formData.append("image1File", data.image1File)
      } else if (data.image1Url) {
        formData.append("image1Url", data.image1Url)
      }

      if (data.image2File) {
        formData.append("image2File", data.image2File)
      } else if (data.image2Url) {
        formData.append("image2Url", data.image2Url)
      }

      const response = await fetch("/api/images/generate", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Failed to generate image")
      }

      const result = await response.json()

      setGeneratedImage({
        imageBase64: result.imageBase64,
        prompt: data.prompt,
      })

      toast.success("Image generated successfully!")
    } catch (error) {
      console.error("Error generating image:", error)
      toast.error("Failed to generate image. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveToSupabase = async (imageBase64: string) => {
    try {
      const response = await fetch("/api/images/upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          imageBase64,
          prompt: generatedImage?.prompt,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to save image")
      }
    } catch (error) {
      console.error("Error saving image:", error)
      throw error
    }
  }

  const handleNewImage = () => {
    setGeneratedImage(null)
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/apps/images">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Create AI Image v0.03</h1>
          <p className="text-muted-foreground">
            Combine and edit images using AI-powered image generation
          </p>
        </div>
      </div>

      {!generatedImage ? (
        <ImageUploadForm onSubmit={handleSubmit} isLoading={isLoading} />
      ) : (
        <div className="space-y-6">
          <ImageResult
            imageBase64={generatedImage.imageBase64}
            prompt={generatedImage.prompt}
            onSaveToSupabase={handleSaveToSupabase}
          />

          <div className="flex justify-center">
            <Button onClick={handleNewImage} variant="outline">
              Create Another Image
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
