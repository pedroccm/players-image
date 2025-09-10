"use client"

import { useState } from "react"
import { useDropzone } from "react-dropzone"
import { toast } from "sonner"
import { CheckCircle, Loader2, Upload, X } from "lucide-react"

import { Button } from "@/components/ui/button"

interface FormImageUploadProps {
  onImageUploaded: (imageUrl: string) => void
  label: string
  disabled?: boolean
  currentImageUrl?: string
}

export function FormImageUpload({
  onImageUploaded,
  label,
  disabled = false,
  currentImageUrl,
}: FormImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp"],
    },
    maxFiles: 1,
    disabled: disabled || isUploading,
    onDrop: async (acceptedFiles) => {
      const file = acceptedFiles[0]
      if (!file) return

      try {
        setIsUploading(true)

        const formData = new FormData()
        formData.append("image", file)

        const response = await fetch("/api/chat-image/upload", {
          method: "POST",
          body: formData,
        })

        if (!response.ok) {
          throw new Error("Failed to upload image")
        }

        const data = await response.json()
        onImageUploaded(data.url)
        toast.success(`${label} enviada com sucesso!`)
      } catch (error) {
        console.error("Error uploading image:", error)
        toast.error(`Erro ao enviar ${label.toLowerCase()}`)
      } finally {
        setIsUploading(false)
      }
    },
  })

  const handleRemoveImage = () => {
    onImageUploaded("")
  }

  if (currentImageUrl) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span className="text-sm text-green-800 font-medium">
              {label} enviada com sucesso!
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRemoveImage}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <img
          src={currentImageUrl}
          alt="Uploaded image"
          className="w-32 h-32 object-cover rounded border"
        />
        <div className="mt-3">
          <div
            {...getRootProps()}
            className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-3 cursor-pointer hover:border-muted-foreground/50 transition-colors text-center"
          >
            <input {...getInputProps()} />
            <p className="text-xs text-muted-foreground">
              Clique para trocar a imagem
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-lg p-6 cursor-pointer transition-colors ${
        isDragActive
          ? "border-primary bg-primary/10"
          : "border-muted-foreground/25 hover:border-muted-foreground/50"
      } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center justify-center gap-3">
        {isUploading ? (
          <>
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
            <p className="text-sm text-muted-foreground">Enviando...</p>
          </>
        ) : (
          <>
            <Upload className="h-8 w-8 text-muted-foreground" />
            <div className="text-center">
              <p className="text-sm font-medium">
                {isDragActive
                  ? "Solte a imagem aqui"
                  : `Clique ou arraste para enviar ${label.toLowerCase()}`}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                PNG, JPG até 10MB
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
