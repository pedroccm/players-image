"use client"

interface Message {
  id: string
  type: "bot" | "user"
  content: string
  timestamp: Date
  imageUrl?: string
}

interface ChatMessageProps {
  message: Message
}

export function ChatMessage({ message }: ChatMessageProps) {
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
              <p className="question">{message.content}</p>
              <span className="time">
                {message.timestamp.toLocaleTimeString("pt-BR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
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
