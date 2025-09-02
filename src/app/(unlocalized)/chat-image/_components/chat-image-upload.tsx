"use client"

import { useState } from "react"
import { useDropzone } from "react-dropzone"
import { Upload, Loader2, CheckCircle } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"

interface ChatImageUploadProps {
  onImageUploaded: (imageUrl: string) => void
  label: string
  disabled?: boolean
}

export function ChatImageUpload({ onImageUploaded, label, disabled = false }: ChatImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null)

  const {
    getRootProps,
    getInputProps,
    isDragActive,
  } = useDropzone({
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
        setUploadedUrl(data.url)
        onImageUploaded(data.url)
      } catch (error) {
        console.error("Error uploading image:", error)
        toast.error("Failed to upload image")
      } finally {
        setIsUploading(false)
      }
    },
  })

  if (uploadedUrl) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <span className="text-sm text-green-800 font-medium">
            {label} uploaded successfully!
          </span>
        </div>
        <img
          src={uploadedUrl}
          alt="Uploaded image"
          className="mt-3 w-32 h-32 object-cover rounded border"
        />
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
            <p className="text-sm text-muted-foreground">Uploading...</p>
          </>
        ) : (
          <>
            <Upload className="h-8 w-8 text-muted-foreground" />
            <div className="text-center">
              <p className="text-sm font-medium">
                {isDragActive ? "Drop image here" : `Click or drag to upload ${label.toLowerCase()}`}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                PNG, JPG up to 10MB
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}