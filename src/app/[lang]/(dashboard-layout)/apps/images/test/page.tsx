import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { Button } from "@/components/ui/button"
import { UploadTest } from "../_components/upload-test"

export default function UploadTestPage() {
  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/apps/images">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Supabase Upload Test v0.02</h1>
          <p className="text-muted-foreground">
            Test uploading images to Supabase Storage
          </p>
        </div>
      </div>

      <UploadTest />
    </div>
  )
}