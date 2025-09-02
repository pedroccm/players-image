import { z } from "zod"

export const imageCreateSchema = z
  .object({
    prompt: z.string().min(10, "Prompt must be at least 10 characters long"),
    image1File: z.any().optional(),
    image2File: z.any().optional(),
    image1Url: z.string().url().optional().or(z.literal("")),
    image2Url: z.string().url().optional().or(z.literal("")),
  })
  .refine(
    (data) => {
      // Pelo menos uma imagem deve ser fornecida (file ou URL)
      const hasImage1 = data.image1File || data.image1Url
      const hasImage2 = data.image2File || data.image2Url
      return hasImage1 && hasImage2
    },
    {
      message: "Both images are required (either as files or URLs)",
      path: ["images"],
    }
  )

export type ImageCreateFormData = z.infer<typeof imageCreateSchema>
