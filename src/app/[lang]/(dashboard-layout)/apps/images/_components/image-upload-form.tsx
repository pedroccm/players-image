"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { useDropzone } from "react-dropzone"
import { Image as ImageIcon, Loader2, Upload, X } from "lucide-react"

import type { ImageCreateFormData } from "../_schemas/image-create-schema"

import { imageCreateSchema } from "../_schemas/image-create-schema"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"

interface ImageUploadFormProps {
  onSubmit: (data: ImageCreateFormData) => Promise<void>
  isLoading?: boolean
}

export function ImageUploadForm({
  onSubmit,
  isLoading = false,
}: ImageUploadFormProps) {
  const [image1Preview, setImage1Preview] = useState<string | null>(null)
  const [image2Preview, setImage2Preview] = useState<string | null>(null)
  const [image1File, setImage1File] = useState<File | null>(null)
  const [image2File, setImage2File] = useState<File | null>(null)

  const form = useForm<ImageCreateFormData>({
    resolver: zodResolver(imageCreateSchema),
    defaultValues: {
      prompt: "",
      image1Url: "",
      image2Url: "",
    },
  })

  const handleFileChange = (
    file: File,
    imageNumber: 1 | 2,
    setValue: (name: keyof ImageCreateFormData, value: unknown) => void
  ) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const preview = e.target?.result as string
      if (imageNumber === 1) {
        setImage1Preview(preview)
        setImage1File(file)
        setValue("image1File", file)
        setValue("image1Url", "")
      } else {
        setImage2Preview(preview)
        setImage2File(file)
        setValue("image2File", file)
        setValue("image2Url", "")
      }
    }
    reader.readAsDataURL(file)
  }

  const handleUrlChange = (
    url: string,
    imageNumber: 1 | 2,
    setValue: (name: keyof ImageCreateFormData, value: unknown) => void
  ) => {
    if (imageNumber === 1) {
      setImage1Preview(url || null)
      setImage1File(null)
      setValue("image1Url", url)
      setValue("image1File", undefined)
    } else {
      setImage2Preview(url || null)
      setImage2File(null)
      setValue("image2Url", url)
      setValue("image2File", undefined)
    }
  }

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
      if (acceptedFiles[0]) {
        handleFileChange(acceptedFiles[0], 1, form.setValue)
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
      if (acceptedFiles[0]) {
        handleFileChange(acceptedFiles[0], 2, form.setValue)
      }
    },
  })

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="h-5 w-5" />
          Create AI Image
        </CardTitle>
        <CardDescription>
          Upload two images and describe how you want them combined or edited
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Image 1 */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Image 1</h3>

                <FormField
                  control={form.control}
                  name="image1File"
                  render={() => (
                    <FormItem>
                      <FormLabel>Upload Image</FormLabel>
                      <FormControl>
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
                                  : "Drag & drop image or click to browse"}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                PNG, JPG up to 10MB
                              </p>
                            </div>
                          </div>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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

                <FormField
                  control={form.control}
                  name="image1Url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Image URL</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="https://example.com/image.jpg"
                          {...field}
                          onChange={(e) => {
                            field.onChange(e)
                            handleUrlChange(e.target.value, 1, form.setValue)
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {image1Preview && (
                  <div className="mt-4 relative">
                    <img
                      src={image1Preview}
                      alt="Image 1 preview"
                      className="w-full h-48 object-cover rounded-lg border"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => {
                        setImage1Preview(null)
                        setImage1File(null)
                        form.setValue("image1File", undefined)
                        form.setValue("image1Url", "")
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>

              {/* Image 2 */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Image 2</h3>

                <FormField
                  control={form.control}
                  name="image2File"
                  render={() => (
                    <FormItem>
                      <FormLabel>Upload Image</FormLabel>
                      <FormControl>
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
                                  : "Drag & drop image or click to browse"}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                PNG, JPG up to 10MB
                              </p>
                            </div>
                          </div>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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

                <FormField
                  control={form.control}
                  name="image2Url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Image URL</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="https://example.com/image.jpg"
                          {...field}
                          onChange={(e) => {
                            field.onChange(e)
                            handleUrlChange(e.target.value, 2, form.setValue)
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {image2Preview && (
                  <div className="mt-4 relative">
                    <img
                      src={image2Preview}
                      alt="Image 2 preview"
                      className="w-full h-48 object-cover rounded-lg border"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => {
                        setImage2Preview(null)
                        setImage2File(null)
                        form.setValue("image2File", undefined)
                        form.setValue("image2Url", "")
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            <FormField
              control={form.control}
              name="prompt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prompt</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe how you want the images combined or edited. For example: 'Combine the images so the T-Rex is wearing a business suit, sitting in a cozy small café, drinking from the mug. Blur the background slightly to create a bokeh effect.'"
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Image...
                </>
              ) : (
                "Generate Image"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
