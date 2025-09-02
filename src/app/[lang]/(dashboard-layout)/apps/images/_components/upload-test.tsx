"use client"

import { useState } from "react"
import { useDropzone } from "react-dropzone"
import { toast } from "sonner"
import { CheckCircle, ExternalLink, Upload, XCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface UploadResult {
  type: "file" | "url"
  name?: string
  url?: string
  error?: string
  status: "success" | "error"
}

export function UploadTest() {
  const [isUploading, setIsUploading] = useState(false)
  const [results, setResults] = useState<UploadResult[]>([])
  const [image1Preview, setImage1Preview] = useState<string | null>(null)
  const [image2Preview, setImage2Preview] = useState<string | null>(null)
  const [image1File, setImage1File] = useState<File | null>(null)
  const [image2File, setImage2File] = useState<File | null>(null)
  const [image1Url, setImage1Url] = useState("")
  const [image2Url, setImage2Url] = useState("")

  // Dropzone for image 1
  const {
    getRootProps: getRootProps1,
    getInputProps: getInputProps1,
    isDragActive: isDragActive1,
  } = useDropzone({
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp"],
    },
    maxFiles: 1,
    onDrop: (acceptedFiles) => {
      const file = acceptedFiles[0]
      if (file) {
        setImage1File(file)
        setImage1Url("")
        const reader = new FileReader()
        reader.onload = (e) => {
          setImage1Preview(e.target?.result as string)
        }
        reader.readAsDataURL(file)
      }
    },
  })

  // Dropzone for image 2
  const {
    getRootProps: getRootProps2,
    getInputProps: getInputProps2,
    isDragActive: isDragActive2,
  } = useDropzone({
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp"],
    },
    maxFiles: 1,
    onDrop: (acceptedFiles) => {
      const file = acceptedFiles[0]
      if (file) {
        setImage2File(file)
        setImage2Url("")
        const reader = new FileReader()
        reader.onload = (e) => {
          setImage2Preview(e.target?.result as string)
        }
        reader.readAsDataURL(file)
      }
    },
  })

  const handleUrlChange = (url: string, imageNumber: 1 | 2) => {
    if (imageNumber === 1) {
      setImage1Url(url)
      setImage1File(null)
      setImage1Preview(url || null)
    } else {
      setImage2Url(url)
      setImage2File(null)
      setImage2Preview(url || null)
    }
  }

  const handleUploadTest = async () => {
    try {
      setIsUploading(true)
      setResults([])

      const formData = new FormData()

      if (image1File) {
        formData.append("image1File", image1File)
      } else if (image1Url) {
        formData.append("image1Url", image1Url)
      }

      if (image2File) {
        formData.append("image2File", image2File)
      } else if (image2Url) {
        formData.append("image2Url", image2Url)
      }

      console.log("Sending upload test request...")

      const response = await fetch("/api/images/upload-test", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()
      console.log("Upload test response:", data)

      if (data.success) {
        setResults(data.results)
        toast.success("Upload test completed successfully!")
      } else {
        toast.error("Upload test failed: " + data.error)
      }
    } catch (error) {
      console.error("Error in upload test:", error)
      toast.error("Upload test failed")
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Supabase Upload Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Image 1 */}
            <div className="space-y-4">
              <Label className="text-lg font-semibold">Image 1</Label>

              <div
                {...getRootProps1()}
                className={`border-2 border-dashed rounded-lg p-6 cursor-pointer transition-colors ${
                  isDragActive1
                    ? "border-primary bg-primary/10"
                    : "border-muted-foreground/25 hover:border-muted-foreground/50"
                }`}
              >
                <input {...getInputProps1()} />
                <div className="flex flex-col items-center justify-center space-y-2">
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <div className="text-center">
                    <p className="text-sm font-medium">
                      {isDragActive1
                        ? "Drop image here"
                        : "Drag & drop or click"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Or
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Image URL</Label>
                <Input
                  placeholder="https://example.com/image.jpg"
                  value={image1Url}
                  onChange={(e) => handleUrlChange(e.target.value, 1)}
                />
              </div>

              {image1Preview && (
                <div className="mt-4">
                  <img
                    src={image1Preview}
                    alt="Image 1 preview"
                    className="w-full h-32 object-cover rounded border"
                  />
                </div>
              )}
            </div>

            {/* Image 2 */}
            <div className="space-y-4">
              <Label className="text-lg font-semibold">Image 2</Label>

              <div
                {...getRootProps2()}
                className={`border-2 border-dashed rounded-lg p-6 cursor-pointer transition-colors ${
                  isDragActive2
                    ? "border-primary bg-primary/10"
                    : "border-muted-foreground/25 hover:border-muted-foreground/50"
                }`}
              >
                <input {...getInputProps2()} />
                <div className="flex flex-col items-center justify-center space-y-2">
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <div className="text-center">
                    <p className="text-sm font-medium">
                      {isDragActive2
                        ? "Drop image here"
                        : "Drag & drop or click"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Or
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Image URL</Label>
                <Input
                  placeholder="https://example.com/image.jpg"
                  value={image2Url}
                  onChange={(e) => handleUrlChange(e.target.value, 2)}
                />
              </div>

              {image2Preview && (
                <div className="mt-4">
                  <img
                    src={image2Preview}
                    alt="Image 2 preview"
                    className="w-full h-32 object-cover rounded border"
                  />
                </div>
              )}
            </div>
          </div>

          <Button
            onClick={handleUploadTest}
            disabled={
              isUploading ||
              (!image1File && !image1Url && !image2File && !image2Url)
            }
            className="w-full"
          >
            {isUploading ? "Testing Upload..." : "Test Upload to Supabase"}
          </Button>

          {results.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Upload Results</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {results.map((result, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 border rounded"
                    >
                      <div className="flex items-center gap-2">
                        {result.status === "success" ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-500" />
                        )}
                        <div>
                          <p className="font-medium">
                            {result.type === "file" ? result.name : "URL"}
                          </p>
                          {result.error && (
                            <p className="text-sm text-red-500">
                              {result.error}
                            </p>
                          )}
                        </div>
                      </div>
                      {result.url && (
                        <a
                          href={result.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-blue-500 hover:text-blue-700"
                        >
                          View <ExternalLink className="h-4 w-4" />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
