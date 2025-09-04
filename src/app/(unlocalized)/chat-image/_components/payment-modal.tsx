"use client"

import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"
import { CheckCircle, Copy, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { QRCodeSVG } from "qrcode.react"

interface PaymentData {
  id: string
  qrCodeText: string
  copyPasteText: string
  qrCodeImage?: string
}

interface PaymentModalProps {
  isOpen: boolean
  onClose: () => void
  onPaymentCompleted: () => void
  userName: string
}

export function PaymentModal({
  isOpen,
  onClose,
  onPaymentCompleted,
  userName,
}: PaymentModalProps) {
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isCheckingPayment, setIsCheckingPayment] = useState(false)
  const [copied, setCopied] = useState(false)

  const createPayment = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/abacatepay/create-qrcode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userName }),
      })

      const data = await response.json()

      if (data.success) {
        setPaymentData({
          id: data.data.id,
          qrCodeText: data.data.brCode,
          copyPasteText: data.data.brCode,
          qrCodeImage: data.data.brCodeBase64,
        })
      } else {
        throw new Error(data.error)
      }
    } catch (_error) {
      console.error("Error creating payment:", _error)
      toast.error("Erro ao criar pagamento")
      onClose()
    } finally {
      setIsLoading(false)
    }
  }, [userName, onClose])

  // Create PIX payment when modal opens
  useEffect(() => {
    if (isOpen && !paymentData) {
      createPayment()
    }
  }, [isOpen, paymentData, createPayment])

  // Poll payment status
  useEffect(() => {
    if (!paymentData?.id || !isOpen) return

    setIsCheckingPayment(true)
    const interval = setInterval(async () => {
      try {
        const response = await fetch(
          `/api/abacatepay/check-payment?id=${paymentData.id}`
        )
        const data = await response.json()

        if (data.success && data.data.status === "PAID") {
          clearInterval(interval)
          setIsCheckingPayment(false)
          toast.success("Pagamento confirmado! 🎉")
          onPaymentCompleted()
          onClose()
        }
      } catch (_error) {
        console.error("Error checking payment:", _error)
      }
    }, 3000) // Check every 3 seconds

    return () => clearInterval(interval)
  }, [paymentData?.id, isOpen, onPaymentCompleted, onClose])

  const copyToClipboard = async () => {
    if (!paymentData?.copyPasteText) return

    try {
      await navigator.clipboard.writeText(paymentData.copyPasteText)
      setCopied(true)
      toast.success("Código PIX copiado!")
      setTimeout(() => setCopied(false), 2000)
    } catch (_error) {
      toast.error("Erro ao copiar código")
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">
            Pagamento PIX - R$ 3,00
          </DialogTitle>
          <DialogDescription className="text-center">
            Escaneie o QR Code ou use o código Pix copia e cola
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              Gerando código PIX...
            </p>
          </div>
        ) : paymentData ? (
          <div className="space-y-6">
            {/* QR Code */}
            <div className="flex justify-center">
              <div className="bg-white p-4 rounded-lg border">
                {paymentData.qrCodeImage ? (
                  <img 
                    src={paymentData.qrCodeImage} 
                    alt="QR Code PIX" 
                    className="w-48 h-48"
                  />
                ) : (
                  <QRCodeSVG value={paymentData.qrCodeText} size={200} />
                )}
              </div>
            </div>

            {/* Copy Paste Code */}
            <div className="space-y-3">
              <label className="text-sm font-medium">
                Ou use o código Pix copia e cola:
              </label>
              <div className="flex gap-2">
                <div className="flex-1 p-3 bg-muted rounded border text-xs font-mono break-all">
                  {paymentData.copyPasteText}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyToClipboard}
                  className="shrink-0"
                >
                  {copied ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Payment Status */}
            {isCheckingPayment && (
              <div className="flex items-center justify-center gap-2 py-4 text-primary">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Aguardando pagamento...</span>
              </div>
            )}

            {/* Instructions */}
            <div className="text-xs text-muted-foreground space-y-1">
              <p>• Abra seu app do banco ou carteira digital</p>
              <p>• Escaneie o QR Code ou cole o código Pix</p>
              <p>• Confirme o pagamento de R$ 3,00</p>
              <p>• O pagamento será confirmado automaticamente</p>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
