"use client"

import { useState } from "react"
import { useDropzone } from "react-dropzone"
import { Upload } from "lucide-react"

interface PhotoUploadProps {
  onUpload: (imageUrl: string) => void
}

export function PhotoUpload({ onUpload }: PhotoUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [uploadStatus, setUploadStatus] = useState<
    "idle" | "uploading" | "success"
  >("idle")

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp"],
    },
    maxFiles: 1,
    disabled: isUploading,
    onDrop: async (acceptedFiles) => {
      const file = acceptedFiles[0]
      if (!file) return

      try {
        setIsUploading(true)
        setUploadStatus("uploading")

        // Create preview
        const reader = new FileReader()
        reader.onload = (e) => {
          setPreviewUrl(e.target?.result as string)
        }
        reader.readAsDataURL(file)

        // Upload to server using the same API as chat-new-image
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
        setUploadStatus("success")
        onUpload(data.url)
      } catch (error) {
        console.error("Upload error:", error)
        setPreviewUrl(null)
        setUploadStatus("idle")
      } finally {
        setIsUploading(false)
      }
    },
  })

  return (
    <div className="q-and-a">
      <div className="image-upload">
        {previewUrl ? (
          <>
            {/* Mensagem de status do upload */}
            {uploadStatus === "uploading" && (
              <div
                style={{
                  color: "var(--main-blue)",
                  fontWeight: 500,
                  lineHeight: "100%",
                  fontSize: "16px",
                  marginBottom: "16px",
                }}
              >
                Estamos subindo sua foto
              </div>
            )}

            {uploadStatus === "success" && (
              <div
                style={{
                  color: "var(--main-blue)",
                  fontWeight: 500,
                  lineHeight: "100%",
                  fontSize: "16px",
                  marginBottom: "16px",
                }}
              >
                Foto enviada ✅
              </div>
            )}

            <div
              className="personal-photo"
              style={{ backgroundImage: `url(${previewUrl})` }}
            ></div>
            <div
              {...getRootProps()}
              style={{
                cursor: "pointer",
                marginTop: "16px",
              }}
            >
              <input {...getInputProps()} />
              <button className="change-photo-btn">
                Clique para trocar a imagem
              </button>
            </div>
          </>
        ) : (
          <div
            {...getRootProps()}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "16px",
              padding: "48px 24px",
              cursor: "pointer",
              textAlign: "center",
            }}
          >
            <input {...getInputProps()} />
            <Upload
              size={48}
              style={{ color: "var(--green)", strokeWidth: 1.5 }}
            />
            <p
              style={{
                color: "var(--main-blue)",
                fontWeight: 500,
                fontSize: "16px",
              }}
            >
              {isUploading
                ? "Enviando foto..."
                : isDragActive
                  ? "Solte a imagem aqui"
                  : "Clique ou arraste para enviar sua foto"}
            </p>
            <p
              style={{
                color: "var(--grey)",
                fontSize: "14px",
              }}
            >
              JPG, PNG ou WEBP • Máx 10MB
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
