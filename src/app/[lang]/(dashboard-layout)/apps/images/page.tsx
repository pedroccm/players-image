import Link from "next/link"
import { Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function ImagesPage() {
  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Images</h1>
          <p className="text-muted-foreground">
            Create and manage AI-generated images using Gemini 2.5 Flash Image
            Edit
          </p>
        </div>
        <div className="flex gap-3">
          <Button asChild variant="outline">
            <Link href="/apps/images/test">
              Test Upload
            </Link>
          </Button>
          <Button asChild>
            <Link href="/apps/images/create">
              <Plus className="mr-2 h-4 w-4" />
              Create Image
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Getting Started</CardTitle>
            <CardDescription>
              Use AI to combine and edit images with natural language prompts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Upload two images and describe how you want them to be combined or
              edited. The AI will generate a new image based on your
              instructions.
            </p>
            <Button asChild variant="outline">
              <Link href="/apps/images/create">Start Creating</Link>
            </Button>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center p-8">
              <Plus className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-center">
                No images created yet. Start by creating your first image.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
