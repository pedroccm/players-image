"use client"

import { useState } from "react"
import { toast } from "sonner"
import { CheckCircle, Copy, Loader2, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface PaymentModalProps {
  userName: string
  onClose: () => void
  onPaymentCompleted: () => void
}

interface PixData {
  qrCodeImage: string
  brCode: string
  amount: number
  paymentId: string
}

export function PaymentModal({
  userName,
  onClose,
  onPaymentCompleted,
}: PaymentModalProps) {
  const [pixData, setPixData] = useState<PixData | null>(null)
  const [isCreatingPayment, setIsCreatingPayment] = useState(false)
  const [isCheckingPayment, setIsCheckingPayment] = useState(false)
  const [copied, setCopied] = useState(false)

  const createPayment = async () => {
    setIsCreatingPayment(true)
    
    try {
      const response = await fetch("/api/abacatepay/create-qrcode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userName }),
      })

      const data = await response.json()

      if (data.success) {
        setPixData({
          qrCodeImage: data.data.brCodeBase64,
          brCode: data.data.brCode,
          amount: data.data.amount,
          paymentId: data.data.id,
        })
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error("Error creating payment:", error)
      toast.error("Erro ao criar pagamento. Tente novamente.")
    } finally {
      setIsCreatingPayment(false)
    }
  }

  const simulatePayment = async () => {
    if (!pixData) return

    try {
      const response = await fetch("/api/abacatepay/simulate-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId: pixData.paymentId }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success("Pagamento simulado! Clique em 'Verificar Pagamento' para confirmar.")
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error("Error simulating payment:", error)
      toast.error("Erro ao simular pagamento")
    }
  }

  const checkPayment = async () => {
    if (!pixData) return

    setIsCheckingPayment(true)

    try {
      const response = await fetch(
        `/api/abacatepay/check-payment?id=${pixData.paymentId}`
      )
      const data = await response.json()

      if (data.success) {
        if (data.data.status === "PAID") {
          toast.success("Pagamento confirmado!")
          onPaymentCompleted()
        } else {
          toast.warning(`Pagamento ainda não confirmado. Status: ${data.data.status}`)
        }
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error("Error checking payment:", error)
      toast.error("Erro ao verificar pagamento")
    } finally {
      setIsCheckingPayment(false)
    }
  }

  const copyPixCode = async () => {
    if (!pixData?.brCode) return

    try {
      await navigator.clipboard.writeText(pixData.brCode)
      setCopied(true)
      toast.success("Código PIX copiado!")
      setTimeout(() => setCopied(false), 2000)
    } catch (_error) {
      toast.error("Erro ao copiar código")
    }
  }

  return (
    <Dialog open={true} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            💎 Upgrade Premium
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
          <DialogDescription>
            Desbloqueie recursos premium por apenas R$ 3,00
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!pixData ? (
            <Card>
              <CardHeader>
                <CardTitle>Recursos Premium</CardTitle>
                <CardDescription>
                  O que você ganha com o upgrade:
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Imagens sem marca d&apos;água</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Alta resolução</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Filtros especiais</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Suporte prioritário</span>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-green-600">
                  PIX - R$ {(pixData.amount / 100).toFixed(2)}
                </CardTitle>
                <CardDescription>
                  Escaneie o QR Code ou use o código copia e cola
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* QR Code */}
                <div className="flex justify-center">
                  <div className="bg-white p-3 rounded-lg border">
                    <img
                      src={pixData.qrCodeImage}
                      alt="QR Code PIX"
                      className="w-48 h-48"
                    />
                  </div>
                </div>

                {/* Código copia e cola */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">
                    Código PIX copia e cola:
                  </label>
                  <div className="flex gap-2">
                    <div className="flex-1 p-2 bg-gray-50 rounded border text-xs font-mono break-all max-h-20 overflow-y-auto">
                      {pixData.brCode}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={copyPixCode}
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

                {/* Instruções */}
                <div className="text-xs text-muted-foreground space-y-1 bg-blue-50 p-3 rounded">
                  <p>• Abra seu app do banco ou carteira digital</p>
                  <p>• Escaneie o QR Code ou cole o código PIX</p>
                  <p>• Confirme o pagamento</p>
                  <p>• Use os botões abaixo para testar:</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Botões */}
          <div className="flex gap-2">
            {!pixData ? (
              <Button
                onClick={createPayment}
                disabled={isCreatingPayment}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {isCreatingPayment ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Criando...
                  </>
                ) : (
                  "💳 Criar Pagamento PIX"
                )}
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={simulatePayment}
                  className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-700"
                >
                  🔵 Simular Pagamento
                </Button>
                <Button
                  onClick={checkPayment}
                  disabled={isCheckingPayment}
                  className="flex-1 bg-green-50 hover:bg-green-100 text-green-700"
                >
                  {isCheckingPayment ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verificando...
                    </>
                  ) : (
                    "🟢 Verificar Pagamento"
                  )}
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}