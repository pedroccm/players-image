"use client"

import { useEffect, useState } from "react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Image as ImageIcon,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface BananasImage {
  id: string
  created_at: string
  prompt: string
  original_image_url_1: string
  original_image_url_2: string
  generated_image_url: string | null
  status: "processing" | "success" | "failed" | "error"
  processing_time_ms: number | null
  error_message: string | null
  generated_image_size: number | null
}

interface PaginationData {
  page: number
  limit: number
  total: number
  pages: number
  hasNext: boolean
  hasPrev: boolean
}

export default function BananasImageListPage() {
  const [records, setRecords] = useState<BananasImage[]>([])
  const [pagination, setPagination] = useState<PaginationData | null>(null)
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

  const fetchRecords = async (page = 1, status = "all") => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "12",
      })

      if (status !== "all") {
        params.append("status", status)
      }

      const response = await fetch(`/api/bananas-image/list?${params}`)
      const data = await response.json()

      if (data.success) {
        setRecords(data.data)
        setPagination(data.pagination)
      }
    } catch (error) {
      console.error("Error fetching records:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRecords(currentPage, statusFilter)
  }, [currentPage, statusFilter])

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage)
  }

  const handleStatusFilterChange = (status: string) => {
    setStatusFilter(status)
    setCurrentPage(1) // Reset to first page when filtering
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      success: { variant: "default" as const, label: "Sucesso" },
      processing: { variant: "secondary" as const, label: "Processando" },
      failed: { variant: "destructive" as const, label: "Falha" },
      error: { variant: "destructive" as const, label: "Erro" },
    }

    const config = variants[status as keyof typeof variants] || variants.error
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "N/A"
    const kb = bytes / 1024
    return kb > 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb.toFixed(1)} KB`
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-primary/10 border-b px-6 py-4">
        <h1 className="text-xl font-semibold">
          Bananas Image - Histórico de Gerações
        </h1>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Filters */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <Select
              value={statusFilter}
              onValueChange={handleStatusFilterChange}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="success">Sucesso</SelectItem>
                <SelectItem value="processing">Processando</SelectItem>
                <SelectItem value="failed">Falha</SelectItem>
                <SelectItem value="error">Erro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {pagination && (
            <div className="text-sm text-muted-foreground">
              {pagination.total} registro{pagination.total !== 1 ? "s" : ""}{" "}
              encontrado{pagination.total !== 1 ? "s" : ""}
            </div>
          )}
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p>Carregando...</p>
          </div>
        ) : records.length === 0 ? (
          <div className="text-center py-12">
            <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Nenhum registro encontrado</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {records.map((record) => (
              <Card key={record.id} className="overflow-hidden">
                <div className="aspect-square relative bg-gray-100">
                  {record.generated_image_url ? (
                    <img
                      src={record.generated_image_url}
                      alt="Imagem gerada"
                      className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() =>
                        setSelectedImage(record.generated_image_url!)
                      }
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2">
                    {getStatusBadge(record.status)}
                  </div>
                </div>

                <CardContent className="p-4">
                  <div className="space-y-2">
                    <p className="text-sm font-medium line-clamp-2">
                      {record.prompt}
                    </p>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {format(
                        new Date(record.created_at),
                        "dd/MM/yyyy 'às' HH:mm",
                        {
                          locale: ptBR,
                        }
                      )}
                    </div>

                    {record.processing_time_ms && (
                      <div className="text-xs text-muted-foreground">
                        Processamento:{" "}
                        {(record.processing_time_ms / 1000).toFixed(1)}s
                      </div>
                    )}

                    {record.generated_image_size && (
                      <div className="text-xs text-muted-foreground">
                        Tamanho: {formatFileSize(record.generated_image_size)}
                      </div>
                    )}

                    {record.error_message && (
                      <div className="text-xs text-red-600 line-clamp-2">
                        Erro: {record.error_message}
                      </div>
                    )}

                    {/* Mostrar ambas as imagens originais */}
                    <div className="flex gap-1 mt-2">
                      <img
                        src={record.original_image_url_1}
                        alt="Imagem original 1"
                        className="w-8 h-8 object-cover rounded border"
                      />
                      <img
                        src={record.original_image_url_2}
                        alt="Imagem original 2"
                        className="w-8 h-8 object-cover rounded border"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.pages > 1 && (
          <div className="flex justify-center items-center mt-8 gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={!pagination.hasPrev}
            >
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </Button>

            <span className="text-sm text-muted-foreground">
              Página {pagination.page} de {pagination.pages}
            </span>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={!pagination.hasNext}
            >
              Próxima
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Modal para visualizar imagem em tamanho completo */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-4xl max-h-full">
            <img
              src={selectedImage}
              alt="Imagem ampliada"
              className="max-w-full max-h-full object-contain"
            />
            <Button
              variant="secondary"
              size="sm"
              className="absolute top-4 right-4"
              onClick={() => setSelectedImage(null)}
            >
              Fechar
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
