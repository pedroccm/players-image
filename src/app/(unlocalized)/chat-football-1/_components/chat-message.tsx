"use client"

import { useState } from "react"

interface Message {
  id: string
  type: "bot" | "user"
  content: string
  timestamp: Date
  imageUrl?: string
  pixData?: {
    qrCodeImage: string
    brCode: string
    amount: number
    paymentId: string
  }
}

interface ChatMessageProps {
  message: Message
  onSimulatePayment?: (paymentId: string) => void
  onCheckPayment?: (paymentId: string) => void
}

export function ChatMessage({
  message,
  onSimulatePayment,
  onCheckPayment,
}: ChatMessageProps) {
  const [copied, setCopied] = useState(false)

  const copyPixCode = async () => {
    if (!message.pixData?.brCode) return

    try {
      await navigator.clipboard.writeText(message.pixData.brCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (_error) {
      console.error("Erro ao copiar código")
    }
  }

  if (message.type === "bot") {
    return (
      <div className="q-and-a">
        {message.content && (
          <div className="question-content">
            <img
              className="logo-circle"
              src="/football/images/logo_circle.png"
              alt="logo"
            />
            <div className="question-data">
              <p
                className="question"
                style={{ lineHeight: "1.6", marginBottom: "8px" }}
              >
                {message.content}
              </p>
            </div>
          </div>
        )}

        {message.imageUrl && (
          <div style={{ marginTop: message.content ? "16px" : "0" }}>
            <img
              src={message.imageUrl}
              alt="Generated"
              style={{
                width: "100%",
                maxWidth: "400px",
                borderRadius: "8px",
                border: "1px solid var(--grey-medium)",
              }}
            />
          </div>
        )}

        {message.pixData && (
          <div
            style={{
              marginTop: message.content ? "16px" : "0",
              maxWidth: "400px",
            }}
          >
            <div
              style={{
                padding: "16px",
                border: "1px solid var(--grey-medium)",
                borderRadius: "8px",
                backgroundColor: "white",
              }}
            >
              {/* Valor */}
              <div style={{ textAlign: "center", marginBottom: "16px" }}>
                <h3
                  style={{
                    fontSize: "18px",
                    fontWeight: "600",
                    color: "#10b981",
                    marginBottom: "4px",
                  }}
                >
                  PIX - R$ {(message.pixData.amount / 100).toFixed(2)}
                </h3>
                <p
                  style={{
                    fontSize: "12px",
                    color: "var(--grey-dark)",
                  }}
                >
                  Escaneie o QR Code ou use o código copia e cola
                </p>
              </div>

              {/* QR Code */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  marginBottom: "16px",
                }}
              >
                <div
                  style={{
                    backgroundColor: "white",
                    padding: "12px",
                    borderRadius: "8px",
                    border: "1px solid var(--grey-medium)",
                  }}
                >
                  <img
                    src={message.pixData.qrCodeImage}
                    alt="QR Code PIX"
                    style={{ width: "192px", height: "192px" }}
                  />
                </div>
              </div>

              {/* Código copia e cola */}
              <div style={{ marginBottom: "16px" }}>
                <label
                  style={{
                    fontSize: "12px",
                    fontWeight: "500",
                    color: "var(--grey-dark)",
                    display: "block",
                    marginBottom: "8px",
                  }}
                >
                  Código PIX copia e cola:
                </label>
                <div style={{ display: "flex", gap: "8px" }}>
                  <div
                    style={{
                      flex: 1,
                      padding: "8px",
                      backgroundColor: "#f3f4f6",
                      borderRadius: "4px",
                      border: "1px solid var(--grey-medium)",
                      fontSize: "12px",
                      fontFamily: "monospace",
                      wordBreak: "break-all",
                      maxHeight: "80px",
                      overflowY: "auto",
                    }}
                  >
                    {message.pixData.brCode}
                  </div>
                  <button
                    onClick={copyPixCode}
                    style={{
                      padding: "8px",
                      border: "1px solid var(--grey-medium)",
                      borderRadius: "4px",
                      backgroundColor: "white",
                      cursor: "pointer",
                      flexShrink: 0,
                    }}
                  >
                    {copied ? "✓" : "📋"}
                  </button>
                </div>
              </div>

              {/* Instruções */}
              <div
                style={{
                  fontSize: "12px",
                  color: "var(--grey-dark)",
                  backgroundColor: "#dbeafe",
                  padding: "12px",
                  borderRadius: "4px",
                  marginBottom: "16px",
                }}
              >
                <p style={{ margin: "4px 0" }}>
                  • Abra seu app do banco ou carteira digital
                </p>
                <p style={{ margin: "4px 0" }}>
                  • Escaneie o QR Code ou cole o código PIX
                </p>
                <p style={{ margin: "4px 0" }}>• Confirme o pagamento</p>
                <p style={{ margin: "4px 0" }}>
                  • Use os botões abaixo para testar:
                </p>
              </div>

              {/* Botões de teste */}
              <div style={{ display: "flex", gap: "8px", paddingTop: "8px" }}>
                <button
                  onClick={() =>
                    onSimulatePayment?.(message.pixData!.paymentId)
                  }
                  style={{
                    flex: 1,
                    padding: "8px",
                    border: "1px solid #3b82f6",
                    borderRadius: "4px",
                    backgroundColor: "#dbeafe",
                    color: "#1e40af",
                    fontSize: "14px",
                    cursor: "pointer",
                    fontWeight: "500",
                  }}
                >
                  🔵 Simular Pagamento
                </button>
                <button
                  onClick={() => onCheckPayment?.(message.pixData!.paymentId)}
                  style={{
                    flex: 1,
                    padding: "8px",
                    border: "1px solid #10b981",
                    borderRadius: "4px",
                    backgroundColor: "#d1fae5",
                    color: "#065f46",
                    fontSize: "14px",
                    cursor: "pointer",
                    fontWeight: "500",
                  }}
                >
                  🟢 Pagamento Concluído
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // User message
  return (
    <div className="q-and-a">
      <div className="reply-answer">
        {message.content}
        {message.imageUrl && (
          <div
            style={{
              marginTop: "12px",
              display: "flex",
              justifyContent: "center",
            }}
          >
            <img
              src={message.imageUrl}
              alt="Selected"
              style={{
                width: "80px",
                aspectRatio: "9 / 16",
                objectFit: "cover",
                borderRadius: "6px",
                border: "1px solid var(--grey-medium)",
              }}
            />
          </div>
        )}
      </div>
    </div>
  )
}
